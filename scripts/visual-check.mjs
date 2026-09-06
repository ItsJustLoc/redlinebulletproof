import { chromium, webkit, devices } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("test-results/visual", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 960 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3100", { waitUntil: "networkidle" });
await page.screenshot({ path: "test-results/visual/desktop-title.png" });
await page.getByRole("link", { name: "Enter the test" }).click();
await page.waitForTimeout(1200);
const top = await page
  .locator("#story")
  .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
for (const [name, p] of [
  ["ready", 0.03],
  ["fire", 0.087],
  ["track", 0.17],
  ["glass", 0.277],
  ["fabric", 0.39],
  ["material", 0.48],
  ["impact", 0.61],
  ["assembly", 0.72],
  ["exploded", 0.87],
  ["finished", 0.99],
]) {
  await page.evaluate(
    ({ top, p }) => window.scrollTo({ top: top + p * 7800, behavior: "instant" }),
    { top, p },
  );
  await page.waitForTimeout(950);
  await page.screenshot({ path: `test-results/visual/${name}.png` });
}
await page.locator("#product").scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await page.locator("#product").screenshot({ path: "test-results/visual/product-section.png" });
await page.locator("#contact").screenshot({ path: "test-results/visual/contact-section.png" });
await page.emulateMedia({ reducedMotion: "reduce" });
await page.waitForTimeout(300);
console.log(
  "runtime reduction",
  await page.locator("canvas").count(),
  "canvas",
  await page.locator(".pin-spacer").count(),
  "pins",
);
console.log("errors", errors);
await browser.close();
const safari = await webkit.launch();
const mobile = await safari.newPage({ ...devices["iPhone 13"] });
await mobile.goto("http://localhost:3100", { waitUntil: "networkidle" });
await mobile.screenshot({ path: "test-results/visual/mobile-title.png" });
await mobile
  .locator("#chapter-redline")
  .screenshot({ path: "test-results/visual/mobile-redline.png" });
await mobile.locator("#product").screenshot({ path: "test-results/visual/mobile-product.png" });
await mobile.locator("#contact").screenshot({ path: "test-results/visual/mobile-contact.png" });
await safari.close();
