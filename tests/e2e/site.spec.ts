import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("title, navigation, and honest contact status", async ({ page }) => {
  const apiUrl = process.env.NEXT_PUBLIC_CONTACT_API_URL;
  if (apiUrl) {
    await page.route(apiUrl, (route) => route.fulfill({ json: { ok: true } }));
  }
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
  await expect(page.getByRole("status")).toContainText(
    apiUrl ? "submitted to Redline" : "Nothing was sent",
  );
  expect(posts).toEqual(apiUrl ? [apiUrl] : []);
  expect(errors).toEqual([]);
});

test("desktop chapters reverse and product inspection works", async ({ page, isMobile }) => {
  test.skip(isMobile, "The separate product inspector remains desktop only.");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#story")).toHaveClass(/cinematic/);
  await expect(page.locator(".scene-poster img")).toBeAttached();
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
  await expect(page.locator(".contact-form noscript p")).toHaveText(
    "Please enable JavaScript to submit the contact form.",
  );
  await expect(page.locator(".contact-form noscript p")).toBeVisible();
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

test("WebGL loss switches to the illustrated reading flow", async ({ page }) => {
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

test("changing motion preference at runtime releases the pinned canvas", async ({ page }) => {
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

test("impact settles, reverses deterministically, and final contact navigation lands visibly", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Phone uses the complete illustrated story.");
  const warnings: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "warning" && /deprecated/i.test(m.text())) warnings.push(m.text());
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Enter the test" }).click();
  const canvas = page.locator(".scene-canvas canvas");
  await expect(page.locator(".scene-canvas")).toHaveAttribute("data-ready", "true");
  const top = await page
    .locator("#story")
    .evaluate((el) => el.getBoundingClientRect().top + scrollY);
  const jump = async (p: number) => {
    await page.evaluate(({ top, p }) => scrollTo({ top: top + p * 7800, behavior: "instant" }), {
      top,
      p,
    });
    await expect
      .poll(async () => Number(await canvas.getAttribute("data-progress")))
      .toBeCloseTo(p, 2);
    await page.waitForTimeout(350);
  };
  await jump(0.64);
  const stopped = await canvas.getAttribute("data-projectile-z");
  const frame = await canvas.getAttribute("data-render-frame");
  await page.waitForTimeout(450);
  expect(await canvas.getAttribute("data-render-frame")).toBe(frame);
  await jump(0.65);
  expect(await canvas.getAttribute("data-projectile-z")).toBe(stopped);
  await jump(0.23);
  await jump(0.64);
  expect(await canvas.getAttribute("data-projectile-z")).toBe(stopped);
  await jump(0.99);
  await page.locator(".seat-reveal-actions").getByRole("link", { name: "Contact Redline" }).click();
  await expect(page.locator("#contact")).toBeInViewport();
  expect(warnings).toEqual([]);
});

test("every inspector part responds, repeated actions settle, and the base renderer remains usable", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Inspector is deliberately desktop only.");
  await page.goto("/?effects=off");
  await page.getByRole("link", { name: "Enter the test" }).click();
  await expect(page.locator(".scene-canvas canvas")).toHaveAttribute("data-effects", "off");
  await page.getByRole("link", { name: "Skip to product" }).click();
  await page.getByRole("button", { name: "Inspect in 3D" }).click();
  const canvas = page.locator(".product-canvas canvas");
  for (const [name, id] of [
    ["Protective fabric", "protective"],
    ["Seat structure", "structure"],
    ["Upholstery", "upholstery"],
  ]) {
    await page
      .locator(".part-controls")
      .getByRole("button", { name: new RegExp(name) })
      .click();
    await expect(canvas).toHaveAttribute("data-selected-part", id);
    await expect(page.locator(".viewer-selection")).toContainText(name);
  }
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Rotate seat right" }).click();
  for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "Rotate seat left" }).click();
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-rotation")))
    .toBeCloseTo(0.6, 2);
  await page.getByRole("button", { name: "Assemble seat", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-exploded", "0.0000");
  await page.waitForTimeout(300);
  const frame = await canvas.getAttribute("data-render-frame");
  await page.waitForTimeout(450);
  expect(await canvas.getAttribute("data-render-frame")).toBe(frame);
  await page.getByRole("button", { name: "Explode seat", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(canvas).toHaveAttribute("data-exploded", "1.0000");
});
