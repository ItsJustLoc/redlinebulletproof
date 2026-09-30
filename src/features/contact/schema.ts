import { z } from "zod";

export const inquiryOptions = [
  "Product information",
  "Request a quote",
  "School-bus seating",
  "Other",
] as const;

function isPhoneFormat(value: string) {
  // Validate formatting, not whether a number is assigned or reachable.
  const digits = value.replace(/\D/g, "");
  const ungrouped = value.replace(/\((\d+)\)/, "$1");
  return (
    digits.length >= 7 &&
    digits.length <= 15 &&
    /^\+?\d[\d .-]*\d$/.test(ungrouped) &&
    !/[ .-]{2}/.test(ungrouped)
  );
}

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "Use 120 characters or fewer.")
    .refine((value) => !/\p{Cc}/u.test(value), "Please enter your name on one line."),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .max(40, "Use 40 characters or fewer.")
    .refine(
      isPhoneFormat,
      "Enter a phone number with 7–15 digits, using spaces, parentheses, hyphens, or a leading +.",
    ),
  email: z.string().trim().pipe(z.email("Please enter a valid email address.").max(254)),
  inquiry: z.enum(inquiryOptions, { error: "Please choose an inquiry type." }),
  description: z
    .string()
    .trim()
    .max(5000, "Use 5,000 characters or fewer.")
    .refine(
      (value) => !/\p{Cc}/u.test(value.replace(/[\r\n\t]/g, "")),
      "Please remove unsupported control characters.",
    )
    .optional()
    .default(""),
  website: z.string().max(200).optional().default(""),
});
