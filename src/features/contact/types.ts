import type { z } from "zod";
import type { contactSchema } from "./schema";
export type ContactInput = z.infer<typeof contactSchema>;
export type ContactErrors = Partial<Record<keyof ContactInput, string>>;
// Resolve only after the backend acknowledges SES acceptance.
export type ContactSubmitHandler = (input: ContactInput) => Promise<void>;
