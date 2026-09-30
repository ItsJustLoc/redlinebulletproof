import { describe, expect, it } from "vitest";
import { contactSchema } from "../src/features/contact/schema";
const valid = {
  name: "Example Person",
  phone: "+1 (555) 010-1234",
  email: "person@example.com",
  inquiry: "Product information",
  description: "We would like to discuss a seating application.",
};
describe("contact validation", () => {
  it("accepts and trims contact input", () =>
    expect(contactSchema.parse({ ...valid, name: " Example Person " }).name).toBe(
      "Example Person",
    ));
  it.each(["name", "phone", "email", "inquiry"])("requires %s", (field) =>
    expect(contactSchema.safeParse({ ...valid, [field]: "" }).success).toBe(false),
  );
  it.each(["", "   ", undefined, "Hi"])("accepts optional description: %j", (description) => {
    expect(contactSchema.parse({ ...valid, description }).description).toBe(
      description?.trim() ?? "",
    );
  });
  it.each(["Product information", "Request a quote", "School-bus seating", "Other"])(
    "accepts inquiry option %s",
    (inquiry) => expect(contactSchema.safeParse({ ...valid, inquiry }).success).toBe(true),
  );
  it.each([["not an option"], [null], [[]], ["Other\nBcc: attacker@example.com"]])(
    "rejects unsupported inquiry: %j",
    (inquiry) => expect(contactSchema.safeParse({ ...valid, inquiry }).success).toBe(false),
  );
  it.each([
    "555-010-1234",
    "(555) 010-1234",
    "+1 (555) 010-1234",
    "+44 20 7946 0958",
    "555.010.1234",
    "5550101",
  ])("accepts formatted phone %s", (phone) =>
    expect(contactSchema.safeParse({ ...valid, phone }).success).toBe(true),
  );
  it.each([
    "123456",
    "1234567890123456",
    "++1 555 010 1234",
    "555+0101234",
    "(555 010-1234",
    "555) 010-1234",
    "555--010-1234",
    "555-010-1234-",
    "555\n0101234",
    "call me",
  ])("rejects malformed phone %j", (phone) =>
    expect(contactSchema.safeParse({ ...valid, phone }).success).toBe(false),
  );
  it.each([
    "person",
    "person@",
    "@example.com",
    "person@example",
    "person name@example.com",
    "person@@example.com",
  ])("rejects malformed email %s", (email) =>
    expect(contactSchema.safeParse({ ...valid, email }).success).toBe(false),
  );
  it("rejects a phone number with no digits", () =>
    expect(contactSchema.safeParse({ ...valid, phone: "call me sometime" }).success).toBe(false));
  it("rejects malformed email and oversized description", () => {
    expect(contactSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, description: "x".repeat(5001) }).success).toBe(
      false,
    );
  });
});
