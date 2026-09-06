import { describe, expect, it } from "vitest";
import { contactSchema } from "../src/features/contact/schema";
const valid = {
  name: "Example Person",
  phone: "+1 (555) 010-1234",
  email: "person@example.com",
  description: "We would like to discuss a seating application.",
};
describe("contact validation", () => {
  it("accepts and trims contact input", () =>
    expect(contactSchema.parse({ ...valid, name: " Example Person " }).name).toBe(
      "Example Person",
    ));
  it.each(["name", "phone", "email", "description"])("requires %s", (field) =>
    expect(contactSchema.safeParse({ ...valid, [field]: "" }).success).toBe(false),
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
