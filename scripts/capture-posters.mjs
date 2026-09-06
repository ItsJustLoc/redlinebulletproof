import { chromium } from "@playwright/test";
import sharp from "sharp";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 960 },
  deviceScaleFactor: 1,
});
await page.goto(process.env.PREVIEW_URL ?? "http://localhost:3100", { waitUntil: "networkidle" });
await page.getByRole("link", { name: "Enter the test" }).click();
await page.waitForTimeout(1200);
const top = await page
  .locator("#story")
  .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
for (const [name, p] of [
  ["test", 0.025],
  ["glass", 0.277],
  ["fabric", 0.39],
  ["redline", 0.61],
  ["seat", 0.998],
  ["exploded", 0.87],
]) {
  await page.evaluate(
    ({ top, p }) => window.scrollTo({ top: top + p * 7800, behavior: "instant" }),
    { top, p },
  );
  await page.waitForTimeout(1300);
  const image = await page.locator(".scene-canvas").screenshot({
    style:
      ".story-overlay,.story-progress,.scene-loading,nextjs-portal{visibility:hidden!important}",
  });
  // Crop the composition to retain the physical object, then produce responsive stills.
  const region =
    name === "test"
      ? { left: 230, top: 0, width: 1210, height: 960 }
      : { left: 440, top: 90, width: 1000, height: 800 };
  await sharp(image)
    .extract(region)
    .resize({ width: 1200 })
    .webp({ quality: 86 })
    .toFile(`public/images/product/story-${name}.webp`);
}
await browser.close();
