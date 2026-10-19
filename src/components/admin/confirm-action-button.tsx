"use client";

import { useRef, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/admin-fields";

interface Props {
  action: () => Promise<ActionResult | void>;
  label: string;
  confirmTitle: string;
  confirmBody: string;
  className?: string;
  onDone?: (result: ActionResult | void) => void;
}

/** Destructive action guarded by an accessible modal confirmation dialog. */
export function ConfirmActionButton({ action, label, confirmTitle, confirmBody, className, onDone }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={className ?? "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-red-700 hover:bg-red-50"}
      >
        {label}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-xl backdrop:bg-black/40"
      >
        <div className="p-6">
          <h2 id="confirm-title" className="text-lg font-semibold text-stone-900">
            {confirmTitle}
          </h2>
          <p className="mt-2 text-sm text-stone-600">{confirmBody}</p>
          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="min-h-11 rounded-full px-4 text-sm font-medium hover:bg-stone-100" onClick={() => dialogRef.current?.close()} autoFocus>
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              className="min-h-11 rounded-full bg-red-700 px-5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              onClick={() =>
                startTransition(async () => {
                  const result = await action();
                  if (result && !result.ok) {
                    setError(result.message);
                    return;
                  }
                  dialogRef.current?.close();
                  onDone?.(result);
                })
              }
            >
              {pending ? "Working…" : label}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
