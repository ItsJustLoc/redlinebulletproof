import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const variant = process.env.REVIEW_PASS || "before";
const base = process.env.PREVIEW_URL || "http://localhost:3001";
const folder = `review-artifacts/quality-pass/${variant}`;
await fs.mkdir(folder, { recursive: true });
const browser = await chromium.launch();
const warnings = [];
for (const [width, height] of process.env.QUICK
  ? [[1440, 900]]
  : [
      [1280, 720],
      [1440, 900],
      [1920, 1080],
    ]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on("console", (m) => {
    if (["warning", "error"].includes(m.type())) warnings.push(m.text());
  });
  page.on("pageerror", (e) => warnings.push(e.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${folder}/${width}-title.png` });
  await page.getByRole("link", { name: "Enter the test" }).click();
  await page.locator(".scene-loading").waitFor({ state: "hidden", timeout: 60000 });
  const top = await page
    .locator("#story")
    .evaluate((el) => el.getBoundingClientRect().top + scrollY);
  for (const [name, p] of [
    ["ready", 0.03],
    ["fire", 0.092],
    ["track", 0.17],
    ["glass", 0.277],
    ["fabric", 0.39],
    ["material", 0.48],
    ["impact", 0.61],
    ["assembly", 0.72],
    ["exploded", 0.87],
    ["finished", 0.99],
  ]) {
    await page.evaluate(({ top, p }) => scrollTo({ top: top + p * 7800, behavior: "instant" }), {
      top,
      p,
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${folder}/${width}-${name}.png` });
  }
  await page.close();
}
await fs.writeFile(`${folder}/console.json`, JSON.stringify([...new Set(warnings)], null, 2));
await browser.close();
console.log(folder, [...new Set(warnings)]);
