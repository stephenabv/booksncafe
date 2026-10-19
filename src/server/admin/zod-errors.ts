import type { z } from "zod";

/** Flattens Zod issues into one message per top-level field. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    errors[key] ??= issue.message;
  }
  return errors;
}
