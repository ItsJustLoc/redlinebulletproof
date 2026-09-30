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
  await page.getByLabel("Inquiry type").selectOption("School-bus seating");
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
  await expect(page.getByLabel("Inquiry type")).toBeDisabled();
  await expect(page.getByLabel("Email Address")).toHaveValue("person@example.com");
  await expect.poll(() => messages.length).toBe(1);
  expect(messages[0].Destination).toEqual({
    ToAddresses: ["nationalgvinyl@gmail.com"],
  });
  expect(messages[0].ReplyToAddresses).toEqual(["person@example.com"]);
  expect(messages[0].Content?.Simple?.Body?.Text?.Data).toContain("Phone: 555-010-1234");
  expect(messages[0].Content?.Simple?.Body?.Text?.Data).toContain("Inquiry: School-bus seating");
  accept();
  await expect(page.getByRole("status")).toContainText("submitted to Redline");
  await expect(page.getByLabel("Email Address")).toHaveValue("");
  await expect(page.getByLabel("Inquiry type")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Contact Redline", exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("validates phone and email on blur without moving focus or sending invalid data", async ({
  page,
}) => {
  let posts = 0;
  await page.route(apiUrl!, (route) => {
    posts++;
    return route.fulfill({ json: { ok: true } });
  });
  await fillContact(page);
  await page.getByLabel("Phone Number").fill("++1 555 010 1234");
  await page.getByLabel("Email Address").fill("person@example");
  await expect(page.getByLabel("Phone Number")).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Inquiry type").focus();
  await expect(page.getByLabel("Inquiry type")).toBeFocused();
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  await page.getByRole("button", { name: "Contact Redline", exact: true }).click();
  await expect(page.getByLabel("Phone Number")).toBeFocused();
  expect(posts).toBe(0);
  await page.getByLabel("Phone Number").fill("+44 20 7946 0958");
  await expect(page.getByLabel("Phone Number")).toHaveAttribute("aria-invalid", "false");
  await page.getByLabel("Email Address").fill("person+quote@example.com");
  await expect(page.getByLabel("Email Address")).toHaveAttribute("aria-invalid", "false");
  await expect(page.getByLabel("Email Address")).toBeFocused();
  await page.getByRole("button", { name: "Contact Redline", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("submitted to Redline");
  expect(posts).toBe(1);
});

test("requires an inquiry choice and delivers through Lambda with no description", async ({
  page,
}) => {
  const messages: SendEmailCommandInput[] = [];
  const handler = createContactHandler(
    async (input) => {
      messages.push(input);
      return { MessageId: "local-test-only" };
    },
    { fromEmail: "contact@example.com", allowedOrigins: [new URL(page.url()).origin] },
  );
  await page.route(apiUrl!, async (route) => {
    const result = await handler({
      headers: route.request().headers(),
      requestContext: { http: { method: route.request().method() } },
      body: route.request().postData() ?? "",
    });
    await route.fulfill({ status: result.statusCode, headers: result.headers, body: result.body });
  });
  await page.getByLabel("Name", { exact: false }).first().fill("Example Person");
  await page.getByLabel("Phone Number").fill("555-010-1234");
  await page.getByLabel("Email Address").fill("person@example.com");
  await expect(page.getByLabel("Description")).not.toHaveAttribute("required");
  await page.getByRole("button", { name: "Contact Redline", exact: true }).click();
  await expect(page.getByLabel("Inquiry type")).toBeFocused();
  await expect(page.getByText("Please choose an inquiry type.")).toBeVisible();
  expect(messages).toHaveLength(0);
  await expect(page.getByLabel("Inquiry type").locator("option")).toHaveText([
    "Select an inquiry type",
    "Product information",
    "Request a quote",
    "School-bus seating",
    "Other",
  ]);
  await page.getByLabel("Inquiry type").selectOption("Request a quote");
  await page.getByRole("button", { name: "Contact Redline", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("submitted to Redline");
  expect(messages).toHaveLength(1);
  expect(messages[0].Content?.Simple?.Body?.Text?.Data).toContain(
    "Inquiry: Request a quote\n\nMessage:\nNo description provided.",
  );
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
