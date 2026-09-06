import type { z } from "zod";
import type { contactSchema } from "./schema";
export type ContactInput = z.infer<typeof contactSchema>;
export type ContactErrors = Partial<Record<keyof ContactInput, string>>;
// A future POST /contact adapter must resolve only after the server accepts the request.
export type ContactSubmitHandler = (input: ContactInput) => Promise<void>;
