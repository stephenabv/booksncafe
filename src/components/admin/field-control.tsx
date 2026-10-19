"use client";

import { useState } from "react";
import type { FieldDef } from "@/lib/admin-fields";

const inputClass =
  "block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 aria-[invalid=true]:border-red-500";

const INPUT_TYPES: Partial<Record<FieldDef["type"], string>> = {
  email: "email",
  tel: "tel",
  url: "text",
  image: "text",
  datetime: "datetime-local",
  date: "date",
  time: "time",
  number: "number",
  money: "text",
};

function ImagePreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    // Plain <img> on purpose: the URL is being edited and may not be optimizable yet.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Preview" className="mt-2 h-28 w-40 rounded-lg border border-stone-200 object-cover" onError={() => setFailed(true)} />
  );
}

export function FieldControl({ field, defaultValue, error }: { field: FieldDef; defaultValue: string | boolean | undefined; error?: string }) {
  const id = `field-${field.name}`;
  const describedBy = [field.help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  const [imageValue, setImageValue] = useState(typeof defaultValue === "string" ? defaultValue : "");
  const wide = field.type === "textarea" || field.type === "image";

  if (field.type === "checkbox") {
    return (
      <div className="flex items-start gap-3 sm:col-span-2">
        <input
          id={id}
          name={field.name}
          type="checkbox"
          defaultChecked={defaultValue === true}
          className="mt-0.5 size-5 rounded border-stone-300 accent-amber-600"
          aria-describedby={describedBy}
        />
        <div>
          <label htmlFor={id} className="text-sm font-medium text-stone-800">
            {field.label}
          </label>
          {field.help && (
            <p id={`${id}-help`} className="text-xs text-stone-500">
              {field.help}
            </p>
          )}
        </div>
      </div>
    );
  }

  const common = {
    id,
    name: field.name,
    required: field.required,
    maxLength: field.maxLength,
    placeholder: field.placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: inputClass,
  };

  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-800">
        {field.label}
        {field.required && (
          <span className="text-red-600" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {field.type === "textarea" ? (
        <textarea {...common} rows={5} defaultValue={String(defaultValue ?? "")} />
      ) : field.type === "select" ? (
        <select {...common} defaultValue={String(defaultValue ?? "")}>
          <option value="">Choose…</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          type={INPUT_TYPES[field.type] ?? "text"}
          inputMode={field.type === "money" ? "decimal" : undefined}
          step={field.type === "number" ? 1 : undefined}
          defaultValue={String(defaultValue ?? "")}
          onChange={field.type === "image" ? (e) => setImageValue(e.target.value) : undefined}
          autoComplete="off"
        />
      )}
      {field.help && (
        <p id={`${id}-help`} className="mt-1 text-xs text-stone-500">
          {field.help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {field.type === "image" && <ImagePreview key={imageValue} src={imageValue} />}
    </div>
  );
}
