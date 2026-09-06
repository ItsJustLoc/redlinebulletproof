"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { company } from "@/data/company";
import { contactSchema } from "./schema";
import type { ContactErrors, ContactInput, ContactSubmitHandler } from "./types";

const subscribeToHydration = () => () => {};

export function ContactForm({ onSubmit }: { onSubmit?: ContactSubmitHandler }) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setStatus("");
    const result = contactSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!result.success) {
      const next: ContactErrors = {};
      for (const issue of result.error.issues)
        next[issue.path[0] as keyof ContactInput] ??= issue.message;
      setErrors(next);
      form.current
        ?.querySelector<HTMLElement>(`[name="${String(result.error.issues[0].path[0])}"]`)
        ?.focus();
      return;
    }
    setErrors({});
    if (!onSubmit) {
      setStatus(
        "Details checked locally. Nothing was sent — contact delivery is not connected yet.",
      );
      return;
    }
    setPending(true);
    try {
      await onSubmit(result.data);
      setStatus("Your message has been received.");
      form.current?.reset();
    } catch {
      setStatus("Your message could not be sent. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      ref={form}
      onSubmit={submit}
      noValidate
      className="contact-form"
      aria-describedby="contact-notice"
    >
      <div className="form-grid">
        {(
          [
            {
              name: "name",
              label: "Name",
              type: "text",
              autoComplete: "name",
              placeholder: "Your full name",
            },
            {
              name: "phone",
              label: "Phone Number",
              type: "tel",
              autoComplete: "tel",
              placeholder: "Your phone number",
            },
            {
              name: "email",
              label: "Email Address",
              type: "email",
              autoComplete: "email",
              placeholder: "you@company.com",
            },
          ] as const
        ).map((field) => (
          <div className={`form-field field-${field.name}`} key={field.name}>
            <label htmlFor={field.name}>
              {field.label} <span aria-hidden="true">*</span>
            </label>
            <input
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              id={field.name}
              required
              aria-invalid={!!errors[field.name]}
              aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
              maxLength={field.name === "name" ? 120 : field.name === "phone" ? 40 : 254}
            />
            {errors[field.name] && (
              <p className="field-error" id={`${field.name}-error`}>
                {errors[field.name]}
              </p>
            )}
          </div>
        ))}
        <div className="form-field field-description">
          <label htmlFor="description">
            Description <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            required
            maxLength={5000}
            placeholder="Tell us about your application or what you would like to explore."
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "description-error" : undefined}
          />
          {errors.description && (
            <p id="description-error" className="field-error">
              {errors.description}
            </p>
          )}
        </div>
      </div>
      <div className="form-bottom">
        <p id="contact-notice">{onSubmit ? "All fields are required." : company.contactStatus}</p>
        <Button type="submit" disabled={pending || !hydrated}>
          {pending ? "Sending" : "Contact Redline"}
          {pending ? (
            <LoaderCircle size={18} aria-hidden="true" />
          ) : (
            <ArrowUpRight size={18} aria-hidden="true" />
          )}
        </Button>
      </div>
      <p className="form-status" role="status">
        {status}
      </p>
      <noscript>
        <p>This prototype needs JavaScript to check the form. Message delivery is not connected.</p>
      </noscript>
    </form>
  );
}
