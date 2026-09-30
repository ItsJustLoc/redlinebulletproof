import { afterEach, describe, expect, it, vi } from "vitest";

const input = {
  name: "Example Person",
  email: "person@example.com",
  phone: "555-010-1234",
  description: "Please discuss a seating application.",
  website: "",
};
async function adapter(endpoint = "https://api.example.test/contact") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_CONTACT_API_URL", endpoint);
  return import("../src/features/contact/submit");
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("contact submission adapter", () => {
  it("posts only JSON with no cookies and requires an explicit acknowledgement", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal("fetch", fetch);
    const { submitContact } = await adapter();
    await expect(submitContact(input)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.test/contact",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(input),
        credentials: "omit",
        redirect: "error",
      }),
    );
  });

  it("fails honestly without a configured endpoint and never calls fetch", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { submitContact } = await adapter("");
    await expect(submitContact(input)).rejects.toThrow("Nothing was sent");
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [200, "<html>static host fallback</html>"],
    [200, JSON.stringify({})],
    [502, JSON.stringify({ error: "private details" })],
    [429, JSON.stringify({ error: "throttled" })],
  ])("rejects HTTP %s with body %s", async (status, body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status })));
    const { submitContact } = await adapter();
    await expect(submitContact(input)).rejects.toThrow(
      status === 429 ? "Please wait" : "could not be sent",
    );
  });

  it("returns only recognized field errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            fields: { email: "Please check your email.", phone: [], unknown: "ignore me" },
          }),
          { status: 400 },
        ),
      ),
    );
    const { submitContact } = await adapter();
    await expect(submitContact(input)).rejects.toMatchObject({
      fields: { email: "Please check your email." },
    });
  });

  it("handles network failure without claiming non-delivery", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Network error")));
    const { submitContact } = await adapter();
    await expect(submitContact(input)).rejects.toThrow("could not confirm");
  });

  it("aborts stalled submissions after 15 seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      ),
    );
    const { submitContact } = await adapter();
    const outcome = expect(submitContact(input)).rejects.toThrow("could not confirm");
    await vi.advanceTimersByTimeAsync(15000);
    await outcome;
  });
});
