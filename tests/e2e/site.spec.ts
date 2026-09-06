import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("title, navigation, and honest contact preview", async ({ page }) => {
  const errors: string[] = [];
  const posts: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.goto("/");
  await expect(page).toHaveTitle(
    "Redline Bulletproof | Protective Fabric for Transportation Seating",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("REDLINEBULLETPROOF");
  await page.getByRole("link", { name: "Let’s talk" }).click();
  await page.getByRole("button", { name: "Contact Redline", exact: true }).click();
  await expect(page.getByLabel("Name", { exact: false }).first()).toBeFocused();
  await expect(page.getByText("Please enter your full name.")).toBeVisible();
  await page.getByLabel("Name", { exact: false }).first().fill("Example Person");
  await page.getByLabel("Phone Number").fill("555-010-1234");
  await page.getByLabel("Email Address").fill("person@example.com");
  await page
    .getByLabel("Description")
    .fill("I would like to discuss a transportation seating application.");
  await page.getByRole("button", { name: "Contact Redline", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Nothing was sent");
  expect(posts).toEqual([]);
  expect(errors).toEqual([]);
});

test("desktop chapters reverse and product inspection works", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mobile intentionally uses the illustrated reading flow.");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#story")).toHaveClass(/cinematic/);
  await expect(page.locator(".scene-canvas canvas")).toHaveCount(0);
  await page.getByRole("link", { name: "Enter the test" }).click();
  await expect(page.locator(".scene-canvas canvas")).toBeVisible();
  await expect(page.locator(".scene-loading")).toHaveCount(0);
  for (const [label, index] of [
    ["Glass", 1],
    ["Fabric", 2],
    ["Redline", 3],
    ["Seat", 4],
    ["Glass", 1],
    ["Test", 0],
  ] as const) {
    await page
      .getByRole("navigation", { name: "Story chapters" })
      .getByRole("button", { name: new RegExp(label, "i") })
      .click();
    await expect(page.locator("#story")).toHaveAttribute("data-stage", String(index));
  }
  await page.getByRole("link", { name: "Skip to product" }).click();
  await page.getByRole("button", { name: "Inspect in 3D" }).click();
  await expect(page.locator(".product-canvas canvas")).toBeVisible();
  await page.getByRole("button", { name: "Explode seat", exact: true }).click();
  await expect(page.getByRole("button", { name: "Assemble seat" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Rotate seat right" }).click();
  await page.getByRole("button", { name: "Assemble seat" }).click();
  await page.getByRole("button", { name: "Close 3D inspection" }).click();
  await expect(page.locator(".product-canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("reduced motion retains every chapter without canvas or pinning", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".fallback-chapter")).toHaveCount(5);
  await expect(page.locator(".fallback-chapter").first()).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  for (const chapter of await page.locator(".fallback-chapter").all()) {
    await chapter.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        chapter
          .locator("img")
          .evaluate(
            (image) =>
              image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
  }
  await page.getByRole("button", { name: "Inspect protective fabric" }).click();
  await expect(
    page.getByText("The Redline material concept, placed within the seat.", { exact: false }),
  ).toBeVisible();
});

test("no JavaScript still exposes the story, product, and contact labels", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".fallback-chapter")).toHaveCount(5);
  await expect(page.locator(".fallback-chapter").first()).toBeVisible();
  await expect(page.getByLabel("Phone Number")).toBeVisible();
  await expect(page.locator("#contact-notice")).toContainText("Submissions are not connected");
  await expect(page.getByRole("button", { name: "Contact Redline", exact: true })).toBeDisabled();
  await context.close();
});

test("responsive page has no horizontal overflow and passes automated accessibility checks", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const widths = isMobile ? [320, 390, 768] : [320, 720, 1440, 1920];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 960 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
  }
  await page.setViewportSize({ width: isMobile ? 390 : 1440, height: 960 });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("WebGL loss switches to the illustrated reading flow", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mobile does not allocate a WebGL context.");
  await page.goto("/");
  await page.getByRole("link", { name: "Enter the test" }).click();
  await expect(page.locator(".scene-loading")).toHaveCount(0);
  await page
    .locator(".scene-canvas canvas")
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await expect(page.locator(".story-frame")).toBeHidden();
  await expect(page.locator(".fallback-chapter").first()).toBeVisible();
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
});

test("changing motion preference at runtime releases the pinned canvas", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Mobile starts with the reading flow.");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("link", { name: "Enter the test" }).click();
  await expect(page.locator(".scene-canvas canvas")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.locator(".fallback-chapter").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("keyboard entry and visible focus work without canvas focus", async ({ page, isMobile }) => {
  test.skip(
    isMobile,
    "iOS hardware-keyboard tab order depends on system keyboard settings; desktop tab order is covered.",
  );
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await expect(page.getByRole("link", { name: "Skip to content" })).toHaveCSS("opacity", "1");
  await page.keyboard.press("Enter");
  await page.getByRole("link", { name: "Let’s talk" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#contact")).toBeInViewport();
  await expect(page.locator("canvas[tabindex='0']")).toHaveCount(0);
});
