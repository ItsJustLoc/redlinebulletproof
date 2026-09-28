import { test, expect } from "@playwright/test";

// These references come from 07ed27c, before the image/mobile/performance pass.
// Mobile has its own layout checks; these guard the authored desktop composition.
for (const viewport of [
  { width: 1440, height: 900, dpr: 1 },
  { width: 1728, height: 960, dpr: 2 },
]) {
  test.describe(`${viewport.width} desktop appearance`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.dpr,
    });
    test("preserves the original chapters and intermediate shots", async ({ page, isMobile }) => {
      test.skip(
        isMobile,
        "Desktop visual references use Chromium; mobile layout is tested separately.",
      );
      await page.goto("/");
      await page.getByRole("link", { name: "Enter the test" }).click();
      await expect(page.locator(".scene-canvas")).toHaveAttribute("data-ready", "true", {
        timeout: 30000,
      });
      const top = await page
        .locator("#story")
        .evaluate((el) => el.getBoundingClientRect().top + scrollY);
      for (const [name, progress] of [
        ["test", 0],
        ["fire", 0.1],
        ["glass", 0.23],
        ["glass-impact", 0.277],
        ["fabric", 0.335],
        ["redline", 0.61],
        ["seat", 0.84],
        ["assembled", 0.99],
      ] as const) {
        await page.evaluate(
          ({ top, progress }) => {
            scrollTo({ top: top + progress * 7800 + 1, behavior: "instant" });
          },
          { top, progress },
        );
        await expect
          .poll(async () =>
            Number(await page.locator(".scene-canvas canvas").getAttribute("data-progress")),
          )
          .toBeCloseTo(progress, 3);
        await page.waitForTimeout(300);
        await expect(page).toHaveScreenshot(`${viewport.width}-${name}.png`, {
          caret: "initial",
          animations: "disabled",
          maxDiffPixelRatio: 0.002,
          threshold: 0.15,
        });
        if (name === "seat") {
          await page.setViewportSize({ width: 390, height: 844 });
          await page.waitForTimeout(200);
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.waitForTimeout(300);
          await expect(page).toHaveScreenshot(`${viewport.width}-${name}.png`, {
            caret: "initial",
            animations: "disabled",
            maxDiffPixelRatio: 0.002,
            threshold: 0.15,
          });
        }
      }
    });
  });
}
