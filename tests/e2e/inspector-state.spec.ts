import { test, expect } from "@playwright/test";

test("protective selection survives entering, resizing, and reopening the inspector", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The separate product inspector remains desktop only.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page
    .locator(".part-controls")
    .getByRole("button", { name: /Protective fabric/ })
    .click();
  await page.getByRole("button", { name: "Inspect in 3D", exact: true }).click();
  const canvas = page.locator(".product-canvas canvas");
  await expect(canvas).toHaveAttribute("data-selected-part", "protective");
  await expect(canvas).toHaveAttribute("data-exploded", "1.0000");
  await expect(page.locator(".product-canvas")).toHaveAttribute("data-ready", "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(canvas).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".product-canvas")).toHaveAttribute("data-ready", "true");
  await expect(canvas).toHaveAttribute("data-exploded", "1.0000");
  await page.getByRole("button", { name: "Close 3D inspection" }).click();
  await page.getByRole("button", { name: "Inspect in 3D", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-selected-part", "protective");
  await expect(canvas).toHaveAttribute("data-exploded", "1.0000");
});
