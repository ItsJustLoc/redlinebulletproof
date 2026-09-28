import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const url = process.env.PREVIEW_URL ?? "http://localhost:3100";
const output = process.env.PROFILE_OUT ?? "review-artifacts/performance";
await fs.mkdir(output, { recursive: true });
const results = [];
for (const config of [
  { name: "desktop", width: 1440, height: 900, dpr: 1, cpu: 1 },
  { name: "desktop-cpu4", width: 1440, height: 900, dpr: 1, cpu: 4 },
  { name: "phone-cpu4", width: 390, height: 844, dpr: 3, cpu: 4 },
]) {
  for (let run = 0; run < 3; run++) {
    const browser = await chromium.launch({
      args: [
        ...(process.platform === "darwin" ? ["--use-angle=metal"] : []),
        "--disable-gpu-shader-disk-cache",
      ],
    });
    try {
      const context = await browser.newContext({
        viewport: { width: config.width, height: config.height },
        deviceScaleFactor: config.dpr,
        isMobile: config.width < 960,
        hasTouch: config.width < 960,
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Performance.enable");
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: config.cpu });
      await cdp.send("Profiler.enable");
      await cdp.send("Profiler.start");
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        window.__longTasks = [];
        new PerformanceObserver((list) => {
          window.__longTasks.push(
            ...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })),
          );
        }).observe({ type: "longtask", buffered: true });
      });
      await page.goto(url);
      await page.locator('.scene-canvas[data-ready="true"]').waitFor({ timeout: 90000 });
      const startup = await page.evaluate(() => ({
        marks: performance.getEntriesByType("mark").map((e) => ({ name: e.name, ms: e.startTime })),
        longTasks: [...window.__longTasks],
      }));
      await page.getByRole("link", { name: "Enter the test" }).click();
      const top = await page
        .locator("#story")
        .evaluate((el) => el.getBoundingClientRect().top + scrollY);
      const traversals = [];
      for (let pass = 0; pass < 2; pass++) {
        await page.evaluate(
          ({ top, pass }) => {
            scrollTo({ top: top + (pass ? 7800 : 0) + 1, behavior: "instant" });
          },
          { top, pass },
        );
        await page.waitForTimeout(300);
        const before = Object.fromEntries(
          (await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]),
        );
        await page.evaluate(() => {
          const sample = (window.__frameSample = { times: [], start: performance.now(), frame: 0 });
          function tick(time) {
            sample.times.push(time);
            sample.frame = requestAnimationFrame(tick);
          }
          sample.frame = requestAnimationFrame(tick);
        });
        // Normal wheel events exercise Lenis and scrollend. Per-frame scrollTo created
        // artificial history writes in the first diagnostic and is not representative.
        await page.mouse.move(config.width / 2, config.height / 2);
        for (let step = 0; step < 32; step++) {
          await page.mouse.wheel(0, ((pass ? -1 : 1) * 7800) / 32);
          await page.waitForTimeout(120);
        }
        await page.waitForTimeout(500);
        const frames = await page.evaluate(() => {
          const { times, start, frame } = window.__frameSample;
          cancelAnimationFrame(frame);
          const gaps = times
            .slice(1)
            .map((t, i) => t - times[i])
            .sort((a, b) => a - b);
          return {
            fps: (1000 * (times.length - 1)) / (times.at(-1) - times[0]),
            p95FrameMs: gaps[Math.floor(gaps.length * 0.95)],
            longTasks: window.__longTasks.filter((e) => e.start >= start),
            scrollY,
          };
        });
        const after = Object.fromEntries(
          (await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]),
        );
        traversals.push({
          ...frames,
          scriptMs: (after.ScriptDuration - before.ScriptDuration) * 1000,
        });
        await page.waitForTimeout(300);
      }
      const { profile } = await cdp.send("Profiler.stop");
      await fs.writeFile(`${output}/${config.name}-${run}.cpuprofile`, JSON.stringify(profile));
      const canvas = await page.locator(".scene-canvas canvas").evaluate((node) => ({
        width: node.width,
        height: node.height,
        dpr: node.dataset.dpr,
      }));
      const result = {
        config,
        run,
        browser: browser.version(),
        input: "wheel",
        canvas,
        startup,
        traversals,
        errors,
      };
      results.push(result);
      await fs.writeFile(`${output}/metrics.json`, JSON.stringify(results, null, 2));
      console.log(JSON.stringify(result));
    } finally {
      await browser.close();
    }
  }
}
