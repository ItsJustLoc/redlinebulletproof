import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 1728, height: 960 }, deviceScaleFactor: 2 });
test("the seat still has native Retina detail without changing its desktop panel", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".product-visual").scrollIntoViewIfNeeded();
  const image = page.locator(".product-image img");
  const details = await image.evaluate(async (element) => {
    const img = element as HTMLImageElement;
    await img.decode();
    const source = new Image();
    source.src = img.currentSrc;
    await source.decode();
    const box = img.getBoundingClientRect();
    return {
      nativeWidth: source.naturalWidth,
      neededWidth:
        Math.max(box.width, (box.height * source.naturalWidth) / source.naturalHeight) *
        devicePixelRatio,
      width: box.width,
      fit: getComputedStyle(img).objectFit,
    };
  });
  expect(details.nativeWidth).toBeGreaterThanOrEqual(details.neededWidth);
  expect(details.width).toBeCloseTo(1005.06, 0);
  expect(details.fit).toBe("cover");
});
