"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { IDLE_RESULT, type ActionResult, type FieldDef, type FormValues } from "@/lib/admin-fields";
import { FieldControl } from "./field-control";

interface Props {
  fields: FieldDef[];
  initialValues: FormValues;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
  cancelHref?: string;
  /** Extra controls rendered beside the submit button (e.g. delete). */
  secondaryActions?: React.ReactNode;
}

/**
 * Schema-driven admin form: renders fields by section, shows server-side
 * validation errors inline, confirms saves and warns about unsaved changes.
 */
export function ResourceForm({ fields, initialValues, action, submitLabel, cancelHref, secondaryActions }: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_RESULT);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Successful in-place saves reset the dirty flag; failures keep it.
  const [lastState, setLastState] = useState(state);
  if (lastState !== state) {
    setLastState(state);
    if (state.ok) setDirty(false);
  }

  useEffect(() => {
    if (state.message) statusRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const sections = useMemo(() => {
    const map = new Map<string, FieldDef[]>();
    for (const f of fields) map.set(f.section ?? "", [...(map.get(f.section ?? "") ?? []), f]);
    return [...map.entries()];
  }, [fields]);

  const errors = state.fieldErrors ?? {};

  return (
    <form
      ref={formRef}
      onChange={() => setDirty(true)}
      onSubmit={(e) => {
        // Dispatch manually instead of via the `action` prop so React does not
        // reset the inputs when the server rejects the submission.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="space-y-8"
      noValidate
    >
      <div ref={statusRef} tabIndex={-1} role={state.ok ? "status" : "alert"} className="focus:outline-none">
        {state.message && (
          <p className={`rounded-xl px-4 py-3 text-sm font-medium ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{state.message}</p>
        )}
      </div>

      {sections.map(([section, sectionFields]) => (
        <fieldset key={section || "main"} className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          {section && <legend className="px-1 text-sm font-semibold uppercase tracking-wider text-stone-500">{section}</legend>}
          <div className="grid gap-5 sm:grid-cols-2">
            {sectionFields.map((field) => (
              <FieldControl key={field.name} field={field} defaultValue={initialValues[field.name]} error={errors[field.name]} />
            ))}
          </div>
        </fieldset>
      ))}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-stone-200 bg-stone-50/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {cancelHref && (
          <Link
            href={cancelHref}
            className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-stone-700 hover:bg-stone-200"
            onClick={(e) => {
              if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) e.preventDefault();
            }}
          >
            Cancel
          </Link>
        )}
        {dirty && <span className="text-sm text-amber-700">Unsaved changes</span>}
        <div className="ml-auto">{secondaryActions}</div>
      </div>
    </form>
  );
}
