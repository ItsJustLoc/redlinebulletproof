import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const label = process.argv[2] || "before";
await fs.mkdir(`review-artifacts/startup/${label}`, { recursive: true });
const b = await chromium.launch({
  channel: "chrome",
  args: ["--use-angle=metal", "--disable-gpu-shader-disk-cache"],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const c = await p.context().newCDPSession(p);
await c.send("Profiler.enable");
await c.send("Profiler.start");
await c.send("Tracing.start", {
  categories: "devtools.timeline,v8,blink.user_timing,disabled-by-default-devtools.timeline",
  transferMode: "ReturnAsStream",
});
await p.goto(process.env.PREVIEW_URL || "http://localhost:3100");
await p.locator(".scene-canvas[data-ready=true]").waitFor({ timeout: 90000 });
await p.getByRole("link", { name: "Enter the test" }).click();
const top = await p.locator("#story").evaluate((e) => e.getBoundingClientRect().top + scrollY);
for (const t of [0.03, 0.092, 0.277, 0.39, 0.61, 0.72, 0.87, 0.99]) {
  await p.evaluate(({ top, t }) => scrollTo({ top: top + t * 7800, behavior: "instant" }), {
    top,
    t,
  });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `review-artifacts/startup/${label}/shot-${t}.png` });
}
const { profile } = await c.send("Profiler.stop");
await fs.writeFile(`review-artifacts/startup/${label}/cpu.cpuprofile`, JSON.stringify(profile));
const complete = new Promise((resolve) => c.once("Tracing.tracingComplete", resolve));
await c.send("Tracing.end");
const { stream } = await complete;
let data = "";
for (;;) {
  const r = await c.send("IO.read", { handle: stream });
  data += r.data;
  if (r.eof) break;
}
await c.send("IO.close", { handle: stream });
await fs.writeFile(`review-artifacts/startup/${label}/chrome-trace.json`, data);
console.log("Saved trace and shots", label);
await b.close();
