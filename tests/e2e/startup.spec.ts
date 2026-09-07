import { test, expect } from "@playwright/test";

test("touch viewport retains the cinematic story and all chapters", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#story")).toHaveClass(/cinematic/);
  await expect(page.locator(".scene-canvas")).toHaveAttribute("data-ready", "true", {
    timeout: 30000,
  });
  await page.getByRole("link", { name: "Enter the test" }).click();
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  for (const [label, stage] of [
    ["Glass", 1],
    ["Fabric", 2],
    ["Redline", 3],
    ["Seat", 4],
    ["Test", 0],
  ] as const) {
    await page
      .getByRole("navigation", { name: "Story chapters" })
      .getByRole("button", { name: new RegExp(label) })
      .click();
    await expect(page.locator("#story")).toHaveAttribute("data-stage", String(stage));
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("ready follows shader preparation and remounts release resources", async ({ page }) => {
  await page.goto("/");
  const allocations: string[] = [];
  for (let cycle = 0; cycle < 3; cycle++) {
    await expect(page.locator(".scene-canvas")).toHaveAttribute("data-ready", "true", {
      timeout: 30000,
    });
    const timing = await page.evaluate(() => ({
      shaders: performance.getEntriesByName("story-shaders-ready").at(-1)?.startTime,
      frame: performance.getEntriesByName("story-frame-ready").at(-1)?.startTime,
    }));
    expect(timing.shaders).toBeGreaterThan(0);
    expect(timing.frame).toBeGreaterThan(timing.shaders!);
    await page.waitForTimeout(150);
    allocations.push(
      (await page.locator(".scene-canvas canvas").getAttribute("data-geometries")) || "",
    );
    await expect(page.locator(".pin-spacer")).toHaveCount(1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  expect(new Set(allocations).size).toBe(1);
});

test("resize, halfway refresh and browser history retain a usable story", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".scene-canvas")).toHaveAttribute("data-ready", "true", {
    timeout: 30000,
  });
  await page.getByRole("link", { name: "Enter the test" }).click();
  await page
    .getByRole("navigation", { name: "Story chapters" })
    .getByRole("button", { name: /Redline/ })
    .click();
  await expect(page.locator("#story")).toHaveAttribute("data-stage", "3");
  await page.reload();
  await expect(page.locator(".scene-canvas")).toHaveAttribute("data-ready", "true", {
    timeout: 30000,
  });
  await expect(page.locator("#story")).toHaveAttribute("data-stage", "3");
  for (const viewport of [
    { width: 844, height: 390 },
    { width: 320, height: 640 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator(".pin-spacer")).toHaveCount(1);
    await page
      .getByRole("navigation", { name: "Story chapters" })
      .getByRole("button", { name: /Glass/ })
      .click();
    await expect(page.locator("#story")).toHaveAttribute("data-stage", "1");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.getByRole("link", { name: "Skip to product" }).click();
  await expect(page.locator("#product")).toBeInViewport();
  await page.goBack();
  await page.goForward();
  await expect(page.locator("#product")).toBeInViewport();
  expect(errors).toEqual([]);
});
