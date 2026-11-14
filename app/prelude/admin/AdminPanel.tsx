"use client";

import { useActionState, useState, useTransition } from "react";
import type { AdminState, GuestRow } from "../../../lib/prelude-types";
import { addGuestsAction, adminLogin, removeGuestAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";
const primaryButton =
  "rounded-full bg-maroon px-5 py-2 text-sm font-medium text-cream transition hover:bg-maroon/90 disabled:opacity-60";
const cardClass = "rounded-2xl border border-gold/30 bg-white/60 p-5";

export function AdminLogin() {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(adminLogin, undefined);
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form action={formAction} className="w-full max-w-sm rounded-3xl border border-gold/40 bg-white/60 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Admin</p>
        <h1 className="mt-3 font-display text-4xl text-maroon">Pre-wedding</h1>
        <label htmlFor="admin-password" className="sr-only">Password</label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className={`${inputClass} mt-6 text-center`}
        />
        {state?.error ? <p role="alert" className="mt-3 text-sm text-maroon">{state.error}</p> : null}
        <button type="submit" disabled={pending} className={`${primaryButton} mt-5 w-full`}>
          {pending ? "Checking..." : "Unlock"}
        </button>
      </form>
    </main>
  );
}

export default function AdminPanel({
  guests,
  databaseConnected,
  loadError,
}: {
  guests: GuestRow[];
  databaseConnected: boolean;
  loadError: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [pasted, setPasted] = useState("");
  const [guestMessage, setGuestMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function addGuests(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuestMessage(null);
    startTransition(async () => {
      const result = await addGuestsAction(pasted);
      if (!result.ok) {
        setGuestMessage({ tone: "err", text: result.error });
        return;
      }
      setPasted("");
      const skipped = result.invalid.length
        ? ` Skipped ${result.invalid.length} invalid entr${result.invalid.length === 1 ? "y" : "ies"}: ${result.invalid.slice(0, 5).join(", ")}${result.invalid.length > 5 ? "..." : ""}`
        : "";
      setGuestMessage({
        tone: "ok",
        text: `Saved ${result.saved} number${result.saved === 1 ? "" : "s"}. Numbers already on the list were kept.${skipped}`,
      });
    });
  }

  function removeGuest(phone: string) {
    if (!window.confirm(`Remove ${phone} from the guest list?`)) return;
    setGuestMessage(null);
    startTransition(async () => {
      const result = await removeGuestAction(phone);
      if (!result.ok) setGuestMessage({ tone: "err", text: result.error });
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6">
      <header>
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Admin</p>
        <h1 className="mt-2 font-display text-4xl font-medium text-maroon sm:text-5xl">Pre-wedding</h1>
        <p className="mt-2 text-sm text-ink/70">
          Events are set in <code>lib/prelude-events.ts</code>, so they are not managed here.
        </p>
      </header>

      {!databaseConnected ? (
        <p role="status" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          The database isn&rsquo;t connected yet. Add the Supabase variables in Vercel and redeploy.
        </p>
      ) : null}
      {loadError ? (
        <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          Couldn&rsquo;t load the guest list. Refresh to try again.
        </p>
      ) : null}

      <section aria-label="Guest list" className={`${cardClass} mt-8`}>
        <h2 className="font-display text-2xl text-maroon">Guest list</h2>
        <p className="mt-1 text-sm text-ink/70">
          Paste mobile numbers, one per line or separated by commas. Guests sign in with the number
          and their name. Their name appears here after their first sign-in.
        </p>
        <form onSubmit={addGuests} className="mt-4 grid gap-3">
          <textarea
            aria-label="Mobile numbers"
            rows={4}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder={"9876543210\n+91 98765 43211, 9123456789"}
            className={inputClass}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={isPending || !databaseConnected || !pasted.trim()} className={primaryButton}>
              Add to guest list
            </button>
            {guestMessage ? (
              <span role="status" className={`text-sm ${guestMessage.tone === "ok" ? "text-ink/70" : "text-maroon"}`}>
                {guestMessage.text}
              </span>
            ) : null}
          </div>
        </form>

        <p className="mt-6 text-xs uppercase tracking-wider text-ink/60">
          {guests.length} guest{guests.length === 1 ? "" : "s"}
        </p>
        {guests.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/60">No guests yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gold/20">
            {guests.map((g) => (
              <li key={g.phone} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="tabular-nums">{g.phone}</span>
                <span className="flex-1 truncate text-ink/70">{g.name ?? "Not signed in yet"}</span>
                <button
                  type="button"
                  onClick={() => removeGuest(g.phone)}
                  disabled={isPending}
                  className="text-ink/60 underline-offset-2 hover:text-maroon hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
