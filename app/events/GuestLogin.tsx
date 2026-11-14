"use client";

import { useActionState } from "react";
import type { GuestState } from "../../lib/prelude-types";
import { loginGuest } from "./actions";
import { EventList } from "./EventList";
import type { PreludeEvent } from "../../lib/prelude-types";

const inputClass =
  "w-full rounded-lg border border-gold/40 bg-white px-4 py-3 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export default function GuestLogin({ mainEvents }: { mainEvents: PreludeEvent[] }) {
  const [state, formAction, pending] = useActionState<GuestState, FormData>(loginGuest, undefined);

  return (
    <section aria-label="Sign in" className="rounded-3xl border border-gold/40 bg-white/60 p-6 sm:p-8">
      <h2 className="font-display text-3xl text-maroon">Find your events</h2>
      <p className="mt-2 text-sm text-ink/70">
        Enter your name and the mobile number we invited you with.
      </p>

      <form action={formAction} className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="guest-name" className="mb-1 block text-xs text-ink/60">
            Your name
          </label>
          <input
            id="guest-name"
            name="name"
            required
            maxLength={60}
            autoComplete="name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="guest-phone" className="mb-1 block text-xs text-ink/60">
            Mobile number
          </label>
          <input
            id="guest-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel-national"
            placeholder="10-digit number"
            className={inputClass}
          />
        </div>

        {state?.error ? (
          <p role="alert" className="text-sm text-maroon sm:col-span-2">
            {state.error}
          </p>
        ) : null}
        {state?.note ? (
          <p role="status" className="text-sm text-ink/70 sm:col-span-2">
            {state.note}
          </p>
        ) : null}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-maroon px-6 py-3 text-sm font-medium text-cream transition hover:bg-maroon/90 disabled:opacity-60"
          >
            {pending ? "Checking..." : "Show my events"}
          </button>
        </div>
      </form>

      {state?.note ? (
        <div className="fade-up mt-8 border-t border-gold/30 pt-6">
          <EventList events={mainEvents} />
        </div>
      ) : null}
    </section>
  );
}
