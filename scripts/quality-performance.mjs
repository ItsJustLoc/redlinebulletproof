import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  args: process.platform === "darwin" ? ["--use-angle=metal"] : [],
});
const results = [];
for (const effects of ["on", "off"]) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.__reviewLongTasks = [];
    new PerformanceObserver((list) =>
      window.__reviewLongTasks.push(
        ...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })),
      ),
    ).observe({ type: "longtask", buffered: true });
  });
  const started = Date.now();
  await page.goto("http://localhost:3100/?effects=" + effects, { waitUntil: "networkidle" });
  const titleReadyMs = Date.now() - started;
  await page.getByRole("link", { name: "Enter the test" }).click();
  await page.locator(".scene-canvas[data-ready=true]").waitFor();
  const canvas = page.locator(".scene-canvas canvas");
  const top = await page
    .locator("#story")
    .evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await page.evaluate((top) => scrollTo({ top: top + 0.03 * 7800, behavior: "instant" }), top);
  await page.waitForTimeout(800);
  const renderer = await canvas.evaluate((canvas) => {
    const gl = canvas.getContext("webgl2");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "Unavailable";
  });
  // Warm every shader/phase before measuring an authored forward/reverse traversal.
  for (const p of [0.03, 0.092, 0.17, 0.277, 0.39, 0.48, 0.61, 0.72, 0.87, 0.99, 0]) {
    await page.evaluate(({ top, p }) => scrollTo({ top: top + p * 7800, behavior: "instant" }), {
      top,
      p,
    });
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(500);
  const scan = await page.evaluate(async (top) => {
    const canvas = document.querySelector(".scene-canvas canvas");
    const times = [],
      renders = [];
    let previousFrame = canvas.dataset.renderFrame;
    const started = performance.now();
    await new Promise((resolve) => {
      const tick = (t) => {
        times.push(t);
        if (canvas.dataset.renderFrame !== previousFrame) {
          renders.push(t);
          previousFrame = canvas.dataset.renderFrame;
        }
        const elapsed = t - started,
          p = elapsed < 4000 ? elapsed / 4000 : 1 - (elapsed - 4000) / 4000;
        scrollTo({ top: top + Math.max(0, Math.min(1, p)) * 7800, behavior: "instant" });
        if (elapsed < 8000) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    const intervals = times
      .slice(1)
      .map((n, i) => n - times[i])
      .sort((a, b) => a - b);
    const renderIntervals = renders
      .slice(1)
      .map((n, i) => n - renders[i])
      .sort((a, b) => a - b);
    const percentile = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];
    return {
      rafCount: times.length,
      observedRenderChanges: renders.length,
      rafMedianMs: percentile(intervals, 0.5),
      rafP95Ms: percentile(intervals, 0.95),
      renderIntervalMedianMs: percentile(renderIntervals, 0.5),
      renderIntervalP95Ms: percentile(renderIntervals, 0.95),
      longTasks: window.__reviewLongTasks.filter((t) => t.start >= started),
      canvasPixels: [canvas.width, canvas.height],
    };
  }, top);
  await page.waitForTimeout(700);
  const before = await canvas.getAttribute("data-render-frame");
  await page.waitForTimeout(1000);
  const after = await canvas.getAttribute("data-render-frame");
  const resources = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((e) => /\.js(\?|$)/.test(e.name))
      .reduce((a, e) => a + e.encodedBodySize, 0),
  );
  results.push({
    effects,
    browser: browser.version(),
    viewport: [1440, 900],
    deviceScaleFactor: 1,
    renderer,
    titleReadyMs,
    encodedJavaScriptBytes: resources,
    ...scan,
    idleRenderCounterChanged: before !== after,
    errors,
  });
  await page.close();
}
await fs.mkdir("review-artifacts/quality-pass", { recursive: true });
await fs.writeFile(
  "review-artifacts/quality-pass/performance.json",
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
await browser.close();
