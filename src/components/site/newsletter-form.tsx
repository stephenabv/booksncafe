"use client";

import { useActionState } from "react";
import { subscribeToNewsletter, type FormState } from "@/server/actions/public";

const initial: FormState = { status: "idle", message: "" };

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initial);
  return (
    <form action={action} className="space-y-2" noValidate={false}>
      <label htmlFor="newsletter-email" className="text-sm text-paper-200">
        Email address
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder="you@example.com"
          className="min-h-11 w-full rounded-full border border-paper-50/20 bg-paper-50/5 px-4 text-sm text-paper-50 placeholder:text-paper-300/70 focus:border-amber-brand focus:outline-none"
          aria-describedby="newsletter-status"
        />
        <button type="submit" className="btn-primary shrink-0" disabled={pending}>
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      <p
        id="newsletter-status"
        role="status"
        className={`min-h-5 text-sm ${state.status === "error" ? "text-red-300" : "text-amber-brand-light"}`}
      >
        {state.message}
      </p>
    </form>
  );
}
