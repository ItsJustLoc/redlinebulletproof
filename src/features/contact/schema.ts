import { z } from "zod";
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
      (value) => /^[+()\d .\-]+$/.test(value) && value.replace(/\D/g, "").length >= 7,
      "Please enter a valid phone number.",
    ),
  email: z.string().trim().pipe(z.email("Please enter a valid email address.").max(254)),
  description: z
    .string()
    .trim()
    .min(10, "Please share a little more (at least 10 characters).")
    .max(5000, "Use 5,000 characters or fewer.")
    .refine(
      (value) => !/\p{Cc}/u.test(value.replace(/[\r\n\t]/g, "")),
      "Please remove unsupported control characters.",
    ),
  website: z.string().max(200).optional().default(""),
});
