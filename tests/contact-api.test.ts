import { describe, expect, it, vi } from "vitest";
import { createContactHandler, type ContactEvent } from "../backend/contact/handler";

const origin = "https://redlinebulletproof.com";
const valid = {
  name: " Example Person ",
  email: " person@example.com ",
  phone: "+1 (555) 010-1234",
  inquiry: "School-bus seating",
  description: "Please discuss seating.\n<script>alert('test')</script>",
  website: "",
};
const event = (body: unknown = valid): ContactEvent => ({
  headers: { origin, "content-type": "application/json; charset=utf-8" },
  requestContext: { http: { method: "POST" } },
  body: JSON.stringify(body),
  isBase64Encoded: false,
});
const setup = () => {
  const send = vi.fn().mockResolvedValue({ MessageId: "ses-test-id" });
  return {
    send,
    handle: createContactHandler(send, {
      fromEmail: "contact@redlinebulletproof.com",
      allowedOrigins: [origin],
    }),
  };
};

describe("contact API", () => {
  it("sends only to the verified business inbox with the visitor as Reply-To", async () => {
    const { handle, send } = setup();
    const result = await handle(event({ ...valid, to: "attacker@example.com" }));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ ok: true });
    expect(send).toHaveBeenCalledExactlyOnceWith({
      FromEmailAddress: "contact@redlinebulletproof.com",
      Destination: {
        ToAddresses: ["nationalgvinyl@gmail.com"],
      },
      ReplyToAddresses: ["person@example.com"],
      Content: {
        Simple: {
          Subject: { Data: "Redline Bulletproof website inquiry", Charset: "UTF-8" },
          Body: {
            Text: {
              Data: `Name: Example Person\nEmail: person@example.com\nPhone: ${valid.phone}\nInquiry: School-bus seating\n\nMessage:\n${valid.description}`,
              Charset: "UTF-8",
            },
          },
        },
      },
    });
  });

  it.each([undefined, "", "  ", "Hi"])(
    "sends a selected inquiry with optional description %j",
    async (description) => {
      const { handle, send } = setup();
      expect((await handle(event({ ...valid, description }))).statusCode).toBe(200);
      expect(send.mock.calls[0][0].Content.Simple.Body.Text.Data).toContain(
        `Inquiry: School-bus seating\n\nMessage:\n${description?.trim() || "No description provided."}`,
      );
    },
  );

  it("accepts cached older forms without an inquiry as Other", async () => {
    const { handle, send } = setup();
    expect((await handle(event({ ...valid, inquiry: undefined }))).statusCode).toBe(200);
    expect(send.mock.calls[0][0].Content.Simple.Body.Text.Data).toContain("Inquiry: Other");
  });

  it.each([
    { name: "" },
    { phone: "no number" },
    { phone: "555\n0101234" },
    { phone: "++1 555 010 1234" },
    { phone: "1234567890123456" },
    { email: "person@example" },
    { inquiry: "" },
    { inquiry: "Forged option" },
    { inquiry: ["Other"] },
    { description: null },
    { email: "person@example.com\r\nBcc: attacker@example.com" },
    { name: "Person\nFake header" },
    { description: "x".repeat(5001) },
    { description: "hello\u0000there" },
    { email: ["person@example.com"] },
    { website: {} },
  ])("rejects invalid data without calling SES: %j", async (invalid) => {
    const { handle, send } = setup();
    expect((await handle(event({ ...valid, ...invalid }))).statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it.each([null, [], "hello", 123])("rejects non-object JSON: %j", async (body) => {
    const { handle, send } = setup();
    expect((await handle(event(body))).statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("silently discards honeypot submissions", async () => {
    const { handle, send } = setup();
    expect((await handle(event({ ...valid, website: "https://spam.example" }))).statusCode).toBe(
      200,
    );
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON, oversized bodies and unsupported media types", async () => {
    const { handle, send } = setup();
    expect((await handle({ ...event(), body: "{" })).statusCode).toBe(400);
    expect((await handle({ ...event(), body: "x".repeat(32769) })).statusCode).toBe(413);
    expect(
      (await handle({ ...event(), headers: { origin, "content-type": "text/plain" } })).statusCode,
    ).toBe(415);
    expect(send).not.toHaveBeenCalled();
  });

  it("decodes API Gateway base64 bodies and bounds their decoded size", async () => {
    const { handle, send } = setup();
    expect(
      (
        await handle({
          ...event(),
          isBase64Encoded: true,
          body: Buffer.from(JSON.stringify(valid)).toString("base64"),
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await handle({
          ...event(),
          isBase64Encoded: true,
          body: Buffer.from("x".repeat(32769)).toString("base64"),
        })
      ).statusCode,
    ).toBe(413);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("fails closed for absent or unapproved origins and non-POST requests", async () => {
    const { handle, send } = setup();
    for (const value of [undefined, "https://evil.example", `${origin}.evil.example`]) {
      expect(
        (await handle({ ...event(), headers: { ...event().headers, origin: value } })).statusCode,
      ).toBe(403);
    }
    expect(
      (await handle({ ...event(), requestContext: { http: { method: "GET" } } })).statusCode,
    ).toBe(405);
    expect(send).not.toHaveBeenCalled();
  });

  it("does not report success or leak provider details when SES fails", async () => {
    const { handle, send } = setup();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      send.mockRejectedValue(new Error("private provider details"));
      const result = await handle(event());
      expect(result.statusCode).toBe(502);
      expect(result.body).not.toContain("private");
      expect(JSON.stringify(log.mock.calls)).not.toContain("private");
      send.mockResolvedValue({});
      expect((await handle(event())).statusCode).toBe(502);
    } finally {
      log.mockRestore();
    }
  });

  it("requires a valid sender configuration before sending", async () => {
    const send = vi.fn();
    const handle = createContactHandler(send, { fromEmail: "", allowedOrigins: [origin] });
    expect((await handle(event())).statusCode).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });

  it("logs an allowlisted delivery error code without provider messages or unknown names", async () => {
    const { handle, send } = setup();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      send.mockRejectedValue(
        Object.assign(new Error("private provider details"), {
          name: "AccessDeniedException",
        }),
      );
      expect((await handle(event())).statusCode).toBe(502);
      expect(log).toHaveBeenLastCalledWith("contact_delivery_failed", "AccessDeniedException");
      send.mockRejectedValue(
        Object.assign(new Error("private provider details"), {
          name: "private unknown error",
        }),
      );
      expect((await handle(event())).statusCode).toBe(502);
      expect(log).toHaveBeenLastCalledWith("contact_delivery_failed", "unknown");
      expect(JSON.stringify(log.mock.calls)).not.toContain("private");
    } finally {
      log.mockRestore();
    }
  });
});
