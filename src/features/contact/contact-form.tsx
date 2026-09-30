"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, ChevronDown, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contactSchema, inquiryOptions } from "./schema";
import { contactApiUrl, ContactSubmitError, submitContact } from "./submit";
import type { ContactErrors, ContactInput, ContactSubmitHandler } from "./types";

const subscribeToHydration = () => () => {};

export function ContactForm({ onSubmit = submitContact }: { onSubmit?: ContactSubmitHandler }) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const focusErrors = useRef(false);
  useEffect(() => {
    const firstField = Object.keys(errors)[0];
    if (!pending && focusErrors.current) {
      focusErrors.current = false;
      if (firstField) form.current?.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus();
    }
  }, [errors, pending]);

  function validateField(field: keyof ContactInput, value: string) {
    const result = contactSchema.shape[field].safeParse(value);
    setErrors((previous) => {
      const next = { ...previous };
      if (result.success) delete next[field];
      else next[field] = result.error.issues[0].message;
      return next;
    });
  }

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setStatus("");
    const result = contactSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!result.success) {
      const next: ContactErrors = {};
      for (const issue of result.error.issues)
        next[issue.path[0] as keyof ContactInput] ??= issue.message;
      focusErrors.current = true;
      setErrors(next);
      setStatus("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    submitting.current = true;
    setPending(true);
    try {
      await onSubmit(result.data);
      setStatus("Thank you. Your message has been submitted to Redline.");
      form.current?.reset();
    } catch (error) {
      setStatus(
        error instanceof ContactSubmitError
          ? error.message
          : "Your message could not be sent. Please try again.",
      );
      if (error instanceof ContactSubmitError) {
        focusErrors.current = true;
        setErrors(error.fields);
      }
    } finally {
      submitting.current = false;
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
      aria-busy={pending}
    >
      <div hidden aria-hidden="true">
        <label htmlFor="contact-website">Leave this field blank</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          maxLength={200}
        />
      </div>
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
              disabled={pending}
              onBlur={(event) => validateField(field.name, event.currentTarget.value)}
              onChange={(event) => {
                if (errors[field.name]) validateField(field.name, event.currentTarget.value);
              }}
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
        <div className="form-field field-inquiry">
          <label htmlFor="inquiry">
            Inquiry type <span aria-hidden="true">*</span>
          </label>
          <div className="form-select">
            <select
              id="inquiry"
              name="inquiry"
              defaultValue=""
              required
              disabled={pending}
              onBlur={(event) => validateField("inquiry", event.currentTarget.value)}
              onChange={(event) => validateField("inquiry", event.currentTarget.value)}
              aria-invalid={!!errors.inquiry}
              aria-describedby={errors.inquiry ? "inquiry-error" : undefined}
            >
              <option value="" disabled>
                Select an inquiry type
              </option>
              {inquiryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </div>
          {errors.inquiry && (
            <p className="field-error" id="inquiry-error">
              {errors.inquiry}
            </p>
          )}
        </div>
        <div className="form-field field-description">
          <label htmlFor="description">
            Description <span>(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            disabled={pending}
            onBlur={(event) => validateField("description", event.currentTarget.value)}
            onChange={(event) => {
              if (errors.description) validateField("description", event.currentTarget.value);
            }}
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
        <p id="contact-notice">
          {contactApiUrl || onSubmit !== submitContact
            ? "Fields marked * are required. Description is optional."
            : "Contact delivery is temporarily unavailable. Please try again later."}
        </p>
        <Button type="submit" disabled={pending || !hydrated}>
          {pending ? "Sending" : "Contact Redline"}
          {pending ? (
            <LoaderCircle size={18} aria-hidden="true" />
          ) : (
            <ArrowUpRight size={18} aria-hidden="true" />
          )}
        </Button>
      </div>
      <p className="form-status" role="status" aria-atomic="true">
        {status}
      </p>
      <noscript>
        <p>Please enable JavaScript to submit the contact form.</p>
      </noscript>
    </form>
  );
}
