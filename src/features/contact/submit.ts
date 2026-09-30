import type { ContactErrors, ContactSubmitHandler } from "./types";

export const contactApiUrl = process.env.NEXT_PUBLIC_CONTACT_API_URL?.trim() ?? "";

export class ContactSubmitError extends Error {
  constructor(
    message: string,
    public readonly fields: ContactErrors = {},
  ) {
    super(message);
  }
}

export const submitContact: ContactSubmitHandler = async (input) => {
  if (!contactApiUrl) {
    throw new ContactSubmitError(
      "Contact delivery is temporarily unavailable. Nothing was sent. Please try again later.",
    );
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(contactApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.ok !== true) {
      const fields: ContactErrors = {};
      if (response.status === 400) {
        for (const field of ["name", "email", "phone", "description"] as const) {
          if (typeof body?.fields?.[field] === "string") fields[field] = body.fields[field];
        }
      }
      throw new ContactSubmitError(
        response.status === 429
          ? "Too many messages right now. Please wait a minute and try again."
          : Object.keys(fields).length
            ? "Please check the highlighted fields."
            : "Your message could not be sent. Please try again later.",
        fields,
      );
    }
  } catch (error) {
    if (error instanceof ContactSubmitError) throw error;
    throw new ContactSubmitError(
      "We could not confirm your message was sent. Check your connection before trying again.",
    );
  } finally {
    clearTimeout(timeout);
  }
};
