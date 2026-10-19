/**
 * Serializable form-field descriptions shared by the admin server code (which
 * validates) and the admin client form (which renders). Plain data only.
 */
export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "url"
  | "image"
  | "slug"
  | "money"
  | "number"
  | "checkbox"
  | "datetime"
  | "date"
  | "time"
  | "select";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  maxLength?: number;
  placeholder?: string;
  options?: ReadonlyArray<{ value: string; label: string }>;
  /** Groups fields into labelled sections in the form. */
  section?: string;
}

export type FormValues = Record<string, string | boolean>;

export interface ActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

export const IDLE_RESULT: ActionResult = { ok: false, message: "" };

/** Converts submitted FormData into raw values keyed by field name. */
export function readFormValues(fields: readonly FieldDef[], formData: FormData): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    if (field.type === "checkbox") {
      values[field.name] = formData.get(field.name) === "on";
    } else {
      const raw = formData.get(field.name);
      values[field.name] = typeof raw === "string" ? raw : "";
    }
  }
  return values;
}
