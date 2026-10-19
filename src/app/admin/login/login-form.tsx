"use client";

import { useActionState } from "react";
import { IDLE_RESULT } from "@/lib/admin-fields";
import { login } from "@/server/actions/admin";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, IDLE_RESULT);
  return (
    <form action={action} className="mt-6 space-y-4">
      {state.message && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {state.message}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" className="block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
      </div>
      <button type="submit" disabled={pending} className="min-h-11 w-full rounded-full bg-stone-900 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
