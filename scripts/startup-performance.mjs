import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const label = process.argv[2] || "before";
const dir = `review-artifacts/startup/${label}`;
await fs.mkdir(dir, { recursive: true });
const results = [];
// Run serially against a production export. Resource sizes are from the main window; worker imports are listed separately by the build.

const configs = process.env.QUICK
  ? [{ name: "desktop", width: 1440, height: 900, cpu: 1 }]
  : [
      { name: "desktop", width: 1440, height: 900, cpu: 1 },
      { name: "cpu4", width: 1440, height: 900, cpu: 4 },
      { name: "network", width: 1440, height: 900, cpu: 1, network: true },
      { name: "mobile", width: 390, height: 844, cpu: 1, mobile: true },
    ];
for (const cfg of configs) {
  const b = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal"] });
  const context = await b.newContext({
    viewport: { width: cfg.width, height: cfg.height },
    deviceScaleFactor: cfg.mobile ? 3 : 1,
    isMobile: !!cfg.mobile,
    hasTouch: !!cfg.mobile,
  });
  const p = await context.newPage();
  const c = await context.newCDPSession(p);
  await c.send("Performance.enable");
  await c.send("Network.enable");
  await c.send("Emulation.setCPUThrottlingRate", { rate: cfg.cpu });
  if (cfg.network)
    await c.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 200000,
      uploadThroughput: 93750,
      connectionType: "cellular4g",
    });
  await p.addInitScript(() => {
    const a = (window.__audit = {
      long: [],
      lcp: [],
      cls: [],
      events: [],
      gl: {},
      ready: null,
      mode: null,
      firstDraw: null,
    });
    for (const [type, key] of [
      ["longtask", "long"],
      ["largest-contentful-paint", "lcp"],
      ["layout-shift", "cls"],
      ["event", "events"],
    ])
      new PerformanceObserver((l) =>
        a[key].push(
          ...l
            .getEntries()
            .map((e) => ({
              start: e.startTime,
              duration: e.duration,
              value: e.value,
              hadRecentInput: e.hadRecentInput,
              id: e.interactionId,
              name: e.name,
            })),
        ),
      ).observe({ type, buffered: true, durationThreshold: 16 });
    new MutationObserver(() => {
      if (!a.mode && document.querySelector("#story.cinematic")) a.mode = performance.now();
      if (!a.ready && document.querySelector(".scene-canvas[data-ready=true]"))
        a.ready = performance.now();
      if (
        !a.firstDraw &&
        Number(document.querySelector(".scene-canvas canvas")?.dataset.renderFrame) > 0
      )
        a.firstDraw = performance.now();
    }).observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-ready", "class", "data-render-frame"],
    });
    for (const name of [
      "getProgramInfoLog",
      "getShaderInfoLog",
      "getUniformLocation",
      "getProgramParameter",
      "texImage2D",
      "texSubImage2D",
      "compileShader",
      "linkProgram",
      "getExtension",
    ]) {
      const original = WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name] = function (...args) {
        const t = performance.now(),
          v = original.apply(this, args),
          d = performance.now() - t;
        const s = (a.gl[name] ??= { calls: 0, ms: 0, max: 0 });
        s.calls++;
        s.ms += d;
        s.max = Math.max(s.max, d);
        return v;
      };
    }
  });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) errors.push(m.text());
  });
  for (let visit = 0; visit < (process.env.QUICK ? 1 : 2); visit++) {
    if (visit === 0) await c.send("Network.clearBrowserCache");

    await p.goto(process.env.PREVIEW_URL || "http://localhost:3100", { waitUntil: "load" });
    const cinematic = !cfg.mobile || label !== "before";
    if (cinematic) await p.locator("#story.cinematic").waitFor({ timeout: 30000 });
    if (cinematic) await p.locator(".scene-canvas[data-ready=true]").waitFor({ timeout: 90000 });
    await p.waitForTimeout(1800);
    const metrics = Object.fromEntries(
      (await c.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]),
    );
    const start = await p.evaluate(() => ({
      a: window.__audit,
      resources: performance
        .getEntriesByType("resource")
        .map((e) => ({
          name: e.name,
          size: e.encodedBodySize,
          decoded: e.decodedBodySize,
          transfer: e.transferSize,
          start: e.startTime,
          end: e.responseEnd,
        })),
      navigation: performance.getEntriesByType("navigation")[0].toJSON(),
      marks: performance
        .getEntriesByType("mark")
        .map((e) => ({ name: e.name, start: e.startTime })),
      canvas: document.querySelector(".scene-canvas canvas")
        ? { ...document.querySelector(".scene-canvas canvas").dataset }
        : null,
    }));
    const r = {
      config: cfg,
      visit,
      browser: b.version(),
      ...start,
      scriptMs: metrics.ScriptDuration * 1000,
      taskMs: metrics.TaskDuration * 1000,
      errors: [...errors],
    };
    await p.screenshot({ path: `${dir}/${cfg.name}-${visit}-hero.png` });
    if (cinematic) {
      await p.getByRole("link", { name: "Enter the test" }).click();
      await p.waitForTimeout(900);
      await p.screenshot({ path: `${dir}/${cfg.name}-${visit}-scene.png` });
      const top = await p
        .locator("#story")
        .evaluate((e) => e.getBoundingClientRect().top + scrollY);
      r.scroll = await p.evaluate(async (top) => {
        const scans = [];
        for (let pass = 0; pass < 2; pass++) {
          const times = [],
            renders = [];
          let frame = "";
          const start = performance.now();
          await new Promise((resolve) => {
            function tick(t) {
              times.push(t);
              const canvas = document.querySelector(".scene-canvas canvas");
              if (canvas.dataset.renderFrame !== frame) {
                renders.push(t);
                frame = canvas.dataset.renderFrame;
              }
              const elapsed = t - start;
              scrollTo({ top: top + Math.min(1, elapsed / 4000) * 7800, behavior: "instant" });
              if (elapsed < 4000) requestAnimationFrame(tick);
              else resolve();
            }
            requestAnimationFrame(tick);
          });
          scans.push({
            rafFps: ((times.length - 1) * 1000) / (times.at(-1) - times[0]),
            renderFps: ((renders.length - 1) * 1000) / (renders.at(-1) - renders[0]),
            long: window.__audit.long.filter((e) => e.start >= start),
          });
          scrollTo({ top, behavior: "instant" });
          await new Promise((r) => setTimeout(r, 600));
        }
        return scans;
      }, top);
    }
    r.interactions = await p.evaluate(() => window.__audit.events.filter((e) => e.id));
    results.push(r);
    await fs.writeFile(`${dir}/metrics.json`, JSON.stringify(results, null, 2));
    console.log(
      JSON.stringify({
        config: cfg.name,
        visit,
        lcp: r.a.lcp.at(-1)?.start,
        ready: r.a.ready,
        scriptMs: r.scriptMs,
        long: r.a.long.map((x) => x.duration),
        gl: r.a.gl,
        js: r.resources.filter((e) => /\.js$/.test(e.name)).reduce((s, e) => s + e.transfer, 0),
        scroll: r.scroll,
      }),
    );
  }
  await b.close();
}
