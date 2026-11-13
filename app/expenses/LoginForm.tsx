"use client";

import { useActionState } from "react";
import type { LoginState } from "../../lib/expense-types";
import { login } from "./actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-3xl border border-gold/40 bg-white/60 p-8 text-center shadow-sm"
      >
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Private</p>
        <h1 className="mt-3 font-display text-4xl font-medium text-maroon">
          Wedding expenses
        </h1>
        <p className="mt-2 text-sm text-ink/60">Enter the password to continue.</p>

        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          className="mt-6 w-full rounded-lg border border-gold/40 bg-white px-4 py-3 text-center outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20"
        />

        {state?.error ? (
          <p role="alert" className="mt-3 text-sm text-maroon">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-full bg-maroon px-5 py-3 text-sm font-medium text-cream transition hover:bg-maroon/90 disabled:opacity-60"
        >
          {pending ? "Checking..." : "Unlock"}
        </button>
      </form>
    </main>
  );
}
