import { z } from "zod";

const uuid = z.string().uuid();

/**
 * Read a uuid field off a form, or null when it is absent or malformed.
 *
 * Seven actions each wrote `z.string().uuid().safeParse(formData.get("x"))`
 * and then branched on `.success`. The same three lines, seven times, is how
 * one of them ends up checking `.data` before `.success` and reading undefined.
 * Callers now get a string or null and branch once.
 */
export function formUuid(formData: FormData, key: string): string | null {
  const parsed = uuid.safeParse(formData.get(key));
  return parsed.success ? parsed.data : null;
}
