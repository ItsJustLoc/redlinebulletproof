import { chromium, webkit, devices } from "@playwright/test";
import fs from "node:fs/promises";
const folder = "review-artifacts/quality-pass/interaction";
await fs.mkdir(folder, { recursive: true });
const browser = await chromium.launch({
  args: process.platform === "darwin" ? ["--use-angle=metal"] : [],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3100", { waitUntil: "networkidle" });
await page.getByRole("link", { name: "Enter the test" }).click();
await page.locator(".scene-loading").waitFor({ state: "hidden" });
const top = await page.locator("#story").evaluate((el) => el.getBoundingClientRect().top + scrollY);
for (const [name, p] of [
  ["ready", 0.03],
  ["fire", 0.092],
  ["contact-before", 0.547],
  ["contact", 0.55],
  ["deformation", 0.58],
  ["stop", 0.63],
  ["hold", 0.65],
  ["transfer", 0.739],
  ["transferred", 0.741],
  ["exploded", 0.87],
  ["assembled", 0.99],
]) {
  await page.evaluate(({ top, p }) => scrollTo({ top: top + p * 7800, behavior: "instant" }), {
    top,
    p,
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: folder + "/" + name + ".png" });
}
await page.getByRole("link", { name: "Explore the application" }).click();
await page.getByRole("button", { name: "Inspect in 3D" }).click();
for (const name of ["Protective fabric", "Seat structure", "Upholstery"]) {
  await page
    .locator(".part-controls")
    .getByRole("button", { name: new RegExp(name) })
    .click();
  await page.waitForTimeout(400);
  await page
    .locator(".product-study")
    .screenshot({
      path: folder + "/inspector-" + name.toLowerCase().replaceAll(" ", "-") + ".png",
    });
}
await page.getByRole("button", { name: "Rotate seat right" }).click();
await page.getByRole("button", { name: "Rotate seat left" }).click();
await page.getByRole("button", { name: "Assemble seat", exact: true }).click();
await page.waitForTimeout(400);
await page.locator(".product-study").screenshot({ path: folder + "/inspector-assembled.png" });
await page.getByRole("button", { name: "Close 3D inspection" }).click();
await page.getByRole("link", { name: "Start a conversation" }).click();
await page.getByRole("button", { name: "Contact Redline", exact: true }).click();
await page.locator("#contact").screenshot({ path: folder + "/contact-validation.png" });
await page.emulateMedia({ reducedMotion: "reduce" });
await page.locator("#chapter-redline").scrollIntoViewIfNeeded();
await page.locator("#chapter-redline img").evaluate((image) => image.decode());
await page.locator("#chapter-redline").screenshot({ path: folder + "/reduced-motion.png" });
// Verify the unavailable-WebGL branch from initial load, not only runtime context loss.
const blocked = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await blocked.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    return /^webgl/.test(type) ? null : original.call(this, type, ...args);
  };
});
await blocked.goto("http://localhost:3100");
await blocked.getByRole("link", { name: "Enter the test" }).click();
await blocked.locator(".fallback-chapter").first().waitFor({ state: "visible" });
await blocked.screenshot({ path: folder + "/webgl-unavailable.png" });
await blocked.close();
const tablet = await browser.newPage({
  viewport: { width: 820, height: 1180 },
  isMobile: true,
  hasTouch: true,
});
await tablet.goto("http://localhost:3100", { waitUntil: "networkidle" });
await tablet.screenshot({ path: folder + "/tablet-title.png" });
await tablet.locator("#chapter-seat").scrollIntoViewIfNeeded();
await tablet.locator("#chapter-seat img").evaluate((i) => i.decode());
await tablet.locator("#chapter-seat").screenshot({ path: folder + "/tablet-seat.png" });
await tablet.close();
await browser.close();
const safari = await webkit.launch(),
  phone = await safari.newPage({ ...devices["iPhone 13"] });
await phone.goto("http://localhost:3100", { waitUntil: "networkidle" });
await phone.screenshot({ path: folder + "/phone-title.png" });
for (const id of ["chapter-redline", "product", "contact"]) {
  await phone.locator("#" + id).scrollIntoViewIfNeeded();
  await phone
    .locator("#" + id + " img")
    .evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
  await phone.locator("#" + id).screenshot({ path: folder + "/phone-" + id + ".png" });
}
await safari.close();
await fs.writeFile(folder + "/errors.json", JSON.stringify(errors, null, 2));
console.log("Interaction captures saved; page errors:", errors);
