import { test, expect, type Page } from "@playwright/test";
import type { SendEmailCommandInput } from "@aws-sdk/client-sesv2";
import { createContactHandler } from "../../backend/contact/handler";

// Build with the same URL used for this run. Every request is intercepted locally.
const apiUrl = process.env.NEXT_PUBLIC_CONTACT_API_URL;
test.skip(!apiUrl, "Build with NEXT_PUBLIC_CONTACT_API_URL to exercise connected delivery states.");

async function fillContact(page: Page) {
  await page.getByLabel("Name", { exact: false }).first().fill("Example Person");
  await page.getByLabel("Phone Number").fill("555-010-1234");
  await page.getByLabel("Email Address").fill("person@example.com");
  await page.getByLabel("Description").fill("Please discuss a transportation seating application.");
}
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#contact");
});

test("submits through the real Lambda handler, waits for SES and resets only on acceptance", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const messages: SendEmailCommandInput[] = [];
  let accept!: () => void;
  const accepted = new Promise<void>((resolve) => {
    accept = resolve;
  });
  const handler = createContactHandler(
    async (input) => {
      messages.push(input);
      await accepted;
      return { MessageId: "local-test-only" };
    },
    { fromEmail: "contact@example.com", allowedOrigins: [new URL(page.url()).origin] },
  );
  await page.route(apiUrl!, async (route) => {
    const request = route.request();
    const result = await handler({
      headers: request.headers(),
      requestContext: { http: { method: request.method() } },
      body: request.postData() ?? "",
    });
    await route.fulfill({ status: result.statusCode, headers: result.headers, body: result.body });
  });
  await fillContact(page);
  await page.getByRole("button", { name: "Contact Redline", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sending" })).toBeDisabled();
  await expect(page.getByLabel("Email Address")).toBeDisabled();
  await expect(page.getByLabel("Email Address")).toHaveValue("person@example.com");
  await expect.poll(() => messages.length).toBe(1);
  expect(messages[0].Destination).toEqual({
    ToAddresses: ["ngvcorp22@gmail.com"],
    CcAddresses: ["nationalgvinyl@gmail.com"],
  });
  expect(messages[0].ReplyToAddresses).toEqual(["person@example.com"]);
  expect(messages[0].Content?.Simple?.Body?.Text?.Data).toContain("Phone: 555-010-1234");
  accept();
  await expect(page.getByRole("status")).toContainText("submitted to Redline");
  await expect(page.getByLabel("Email Address")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Contact Redline", exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("server validation focuses the rejected field and retains entries", async ({ page }) => {
  await page.route(apiUrl!, (route) =>
    route.fulfill({
      status: 400,
      json: { fields: { email: "Please check this email address." } },
    }),
  );
  await fillContact(page);
  await page.getByRole("button", { name: "Contact Redline", exact: true }).click();
  await expect(page.getByLabel("Email Address")).toBeFocused();
  await expect(page.getByText("Please check this email address.")).toBeVisible();
  await expect(page.getByLabel("Description")).toHaveValue(
    "Please discuss a transportation seating application.",
  );
});

for (const scenario of ["provider", "network", "throttled", "unexpected response"] as const) {
  test(`${scenario} failure retains fields and allows a successful retry`, async ({ page }) => {
    let attempts = 0;
    await page.route(apiUrl!, async (route) => {
      attempts++;
      if (attempts > 1) return route.fulfill({ json: { ok: true } });
      if (scenario === "network") return route.abort("failed");
      if (scenario === "unexpected response")
        return route.fulfill({ body: "<html>Not an API</html>", contentType: "text/html" });
      return route.fulfill({
        status: scenario === "throttled" ? 429 : 502,
        json: { error: "unavailable" },
      });
    });
    await fillContact(page);
    await page.getByRole("button", { name: "Contact Redline", exact: true }).click();
    await expect(page.getByRole("status")).toContainText(
      scenario === "network"
        ? "could not confirm"
        : scenario === "throttled"
          ? "Please wait"
          : "could not be sent",
    );
    await expect(page.getByLabel("Email Address")).toHaveValue("person@example.com");
    await page.getByRole("button", { name: "Contact Redline", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("submitted to Redline");
    expect(attempts).toBe(2);
  });
}

test("honeypot is excluded from the visible form and keyboard order", async ({ page }) => {
  await expect(page.locator("#contact-website")).toBeHidden();
  await expect(page.locator("#contact-website")).toHaveAttribute("tabindex", "-1");
  await expect(page.locator(".contact-form input:visible")).toHaveCount(3);
});
