import { test, expect, type Page, type TestInfo } from "@playwright/test";

async function capture(page: Page, testInfo: TestInfo, name: string) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, caret: "initial" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

async function checkSeatLabels(page: Page, testInfo: TestInfo, name: string) {
  const labels = page.locator(".seat-part-label");
  await expect(labels).toHaveCount(4);
  await capture(page, testInfo, name);
  const bounds = await labels.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        text: element.textContent,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      };
    }),
  );
  const copy = await page.locator(".stage-copy").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  });
  const viewport = page.viewportSize()!;
  await testInfo.attach(`${name}-bounds`, {
    body: JSON.stringify({ viewport, bounds, copy }, null, 2),
    contentType: "application/json",
  });
  for (const label of bounds) {
    expect.soft(label.left, `${label.text} left edge`).toBeGreaterThanOrEqual(0);
    expect.soft(label.right, `${label.text} right edge`).toBeLessThanOrEqual(viewport.width);
    expect.soft(label.top, `${label.text} top edge`).toBeGreaterThanOrEqual(0);
    expect.soft(label.bottom, `${label.text} bottom edge`).toBeLessThanOrEqual(viewport.height);
    const overlapsCopy =
      label.left < copy.right &&
      label.right > copy.left &&
      label.top < copy.bottom &&
      label.bottom > copy.top;
    expect.soft(overlapsCopy, `${label.text} overlaps story copy or its actions`).toBe(false);
  }
  for (let i = 0; i < bounds.length; i++) {
    for (let j = i + 1; j < bounds.length; j++) {
      const a = bounds[i];
      const b = bounds[j];
      const overlap = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      expect.soft(overlap, `${a.text} overlaps ${b.text}`).toBe(false);
    }
  }
}

for (const viewport of [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 959, height: 900 },
]) {
  test(`mobile story chapters and seat annotations remain usable at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator(".scene-canvas")).toHaveAttribute("data-ready", "true", {
      timeout: 30000,
    });
    await page.getByRole("link", { name: "Enter the test" }).click();
    const chapters = page.getByRole("navigation", { name: "Story chapters" });
    for (const [label, stage, progress] of [
      ["Glass", 1, 0.23],
      ["Fabric", 2, 0.335],
      ["Redline", 3, 0.465],
      ["Seat", 4, 0.84],
    ] as const) {
      await chapters.getByRole("button", { name: new RegExp(label) }).click();
      await expect(page.locator("#story")).toHaveAttribute("data-stage", String(stage));
      await expect
        .poll(async () =>
          Number(await page.locator(".scene-canvas canvas").getAttribute("data-progress")),
        )
        .toBeCloseTo(progress, 3);
      await capture(page, testInfo, label.toLowerCase());
    }
    await checkSeatLabels(page, testInfo, "seat-annotations");
    await chapters.getByRole("button", { name: /Test/ }).click({ timeout: 5000 });
    await expect(page.locator("#story")).toHaveAttribute("data-stage", "0");
    expect(errors).toEqual([]);
  });
}

test("rotating a phone keeps story navigation and the complete seat study available", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".scene-canvas")).toHaveAttribute("data-ready", "true", {
    timeout: 30000,
  });
  await page.getByRole("link", { name: "Enter the test" }).click();
  const chapters = page.getByRole("navigation", { name: "Story chapters" });
  await chapters.getByRole("button", { name: /Seat/ }).click();
  await expect(page.locator("#story")).toHaveAttribute("data-stage", "4");
  const canvas = page.locator(".scene-canvas canvas");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-progress")))
    .toBeCloseTo(0.84, 3);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator("#story")).toHaveAttribute("data-phase", "EXPLODED_VIEW");
  // Native resize completes before R3F's ResizeObserver updates its drawing buffer.
  await expect
    .poll(() =>
      canvas.evaluate((node) => {
        const element = node as HTMLCanvasElement;
        const dpr = Number(element.dataset.dpr);
        return element.width === Math.floor(844 * dpr) && element.height === Math.floor(390 * dpr);
      }),
    )
    .toBe(true);
  await checkSeatLabels(page, testInfo, "landscape-seat-annotations");
  await chapters.getByRole("button", { name: /Glass/ }).click();
  await expect(page.locator("#story")).toHaveAttribute("data-stage", "1");
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  await capture(page, testInfo, "landscape-story");
  await page.getByRole("link", { name: "Skip to product" }).click();
  const image = page.locator(".product-image img");
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await capture(page, testInfo, "landscape-seat-study");
  const crop = await image.evaluate((node) => {
    const image = node as HTMLImageElement;
    const rect = image.getBoundingClientRect();
    const fit = getComputedStyle(image).objectFit;
    const scale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
    return {
      fit,
      croppedWidth: fit === "cover" ? image.naturalWidth * scale - rect.width : 0,
      croppedHeight: fit === "cover" ? image.naturalHeight * scale - rect.height : 0,
      frame: { width: rect.width, height: rect.height },
      source: { width: image.naturalWidth, height: image.naturalHeight },
    };
  });
  await testInfo.attach("landscape-image-crop", {
    body: JSON.stringify(crop, null, 2),
    contentType: "application/json",
  });
  expect
    .soft(crop.croppedWidth, "seat image must retain its full horizontal composition")
    .toBeLessThanOrEqual(1);
  expect
    .soft(crop.croppedHeight, "seat image must retain its full vertical composition")
    .toBeLessThanOrEqual(1);
  for (const name of ["Protective fabric", "Seat structure", "Upholstery"]) {
    const control = page.locator(".part-controls").getByRole("button", { name: new RegExp(name) });
    await control.click();
    await expect(control).toHaveAttribute("aria-pressed", "true");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Inspect protective fabric" }).click();
  await expect(page.locator(".part-description")).toContainText("The Redline material concept");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
});
