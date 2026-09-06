import { z } from "zod";
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "Use 120 characters or fewer."),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .max(40, "Use 40 characters or fewer.")
    .refine(
      (value) => /^[+()\d\s.\-]+$/.test(value) && value.replace(/\D/g, "").length >= 7,
      "Please enter a valid phone number.",
    ),
  email: z
    .email("Please enter a valid email address.")
    .max(254)
    .transform((value) => value.trim()),
  description: z
    .string()
    .trim()
    .min(10, "Please share a little more (at least 10 characters).")
    .max(5000, "Use 5,000 characters or fewer."),
});
