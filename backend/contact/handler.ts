import { SESv2Client, SendEmailCommand, type SendEmailCommandInput } from "@aws-sdk/client-sesv2";
import { z } from "zod";
import { contactSchema } from "../../src/features/contact/schema";

// Only the API Gateway HTTP API payload fields this handler consumes.
export type ContactEvent = {
  headers: Record<string, string | undefined>;
  requestContext: { http: { method: string } };
  body?: string;
  isBase64Encoded?: boolean;
};
type Config = { fromEmail: string; allowedOrigins: string[] };
type SendEmail = (input: SendEmailCommandInput) => Promise<{ MessageId?: string }>;

const maxBodyBytes = 32 * 1024;
const reply = (statusCode: number, body: object) => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  },
  body: JSON.stringify(body),
});

export function createContactHandler(sendEmail: SendEmail, config: Config) {
  return async (event: ContactEvent) => {
    if (event.requestContext.http.method !== "POST") {
      return reply(405, { error: "Method not allowed." });
    }
    // API Gateway owns CORS, including preflight and gateway errors.
    // Also reject unapproved origins before causing an email side effect.
    const origin = event.headers.origin;
    if (!origin || !config.allowedOrigins.includes(origin)) {
      return reply(403, { error: "Origin not allowed." });
    }
    if (event.headers["content-type"]?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return reply(415, { error: "Send an application/json request." });
    }
    const encoded = event.body ?? "";
    if (
      Buffer.byteLength(encoded) >
      (event.isBase64Encoded ? 4 * Math.ceil(maxBodyBytes / 3) : maxBodyBytes)
    ) {
      return reply(413, { error: "Request too large." });
    }
    const body = event.isBase64Encoded ? Buffer.from(encoded, "base64").toString("utf8") : encoded;
    if (Buffer.byteLength(body) > maxBodyBytes) {
      return reply(413, { error: "Request too large." });
    }
    let input: unknown;
    try {
      input = JSON.parse(body);
    } catch {
      return reply(400, { error: "Invalid JSON." });
    }
    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && field !== "website") fields[field] ??= issue.message;
      }
      return reply(400, { error: "Please check the form fields.", fields });
    }
    if (parsed.data.website) return reply(200, { ok: true });
    if (!z.email().safeParse(config.fromEmail).success) {
      return reply(503, { error: "Contact delivery is temporarily unavailable." });
    }
    const { name, email, phone, description } = parsed.data;
    try {
      const sent = await sendEmail({
        FromEmailAddress: config.fromEmail,
        Destination: {
          ToAddresses: ["ngvcorp22@gmail.com"],
          CcAddresses: ["nationalgvinyl@gmail.com"],
        },
        ReplyToAddresses: [email],
        Content: {
          Simple: {
            Subject: { Data: "Redline Bulletproof website inquiry", Charset: "UTF-8" },
            Body: {
              Text: {
                Data: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${description}`,
                Charset: "UTF-8",
              },
            },
          },
        },
      });
      if (!sent.MessageId) throw new Error("SES did not acknowledge the message");
      return reply(200, { ok: true });
    } catch {
      // Never log the payload, recipient details, or raw provider exception.
      console.error("contact_delivery_failed");
      return reply(502, { error: "Your message could not be sent. Please try again later." });
    }
  };
}

// Lambda's execution role supplies credentials; none are passed by the visitor.
// Disable automatic SES retries because SendEmail has no idempotency token.
const ses = new SESv2Client({
  maxAttempts: 1,
  requestHandler: { connectionTimeout: 2000, requestTimeout: 8000 },
});
export const handler = createContactHandler((input) => ses.send(new SendEmailCommand(input)), {
  fromEmail: process.env.SES_FROM_EMAIL ?? "",
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
});
