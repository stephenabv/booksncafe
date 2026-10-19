"use client";

import { useActionState } from "react";
import { subscribeToNewsletter, type FormState } from "@/server/actions/public";

const initial: FormState = { status: "idle", message: "" };

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initial);
  return (
    <form action={action} className="w-full space-y-2" noValidate={false}>
      <label htmlFor="newsletter-email" className="block text-sm text-paper-200">
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
          className="min-h-12 w-full min-w-0 flex-1 rounded-full border border-paper-50/20 bg-paper-50/5 px-4 text-base sm:px-5 text-paper-50 placeholder:text-paper-300/70 focus:border-amber-brand focus:outline-none"
          aria-describedby="newsletter-status"
        />
        <button type="submit" className="btn-primary min-h-12 shrink-0 sm:px-8" disabled={pending}>
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
