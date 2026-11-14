"use client";

import { useActionState, useState, useTransition } from "react";
import {
  AUDIENCES,
  type Audience,
  type AdminState,
  type GuestRow,
  type PreludeEvent,
} from "../../../lib/prelude-types";
import {
  addGuestsAction,
  adminLogin,
  deleteEventAction,
  removeGuestAction,
  saveEventAction,
} from "./actions";

const inputClass =
  "w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";
const primaryButton =
  "rounded-full bg-maroon px-5 py-2 text-sm font-medium text-cream transition hover:bg-maroon/90 disabled:opacity-60";
const ghostButton =
  "rounded-full border border-gold/50 px-4 py-2 text-sm text-ink transition hover:bg-gold/10 disabled:opacity-60";
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

type EventForm = {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  details: string;
  audience: Audience;
  sortOrder: string;
};

function emptyEventForm(): EventForm {
  return { id: "", title: "", date: "", time: "", venue: "", details: "", audience: "guests", sortOrder: "0" };
}

function toForm(e: PreludeEvent): EventForm {
  return {
    id: e.id,
    title: e.title,
    date: e.date ?? "",
    time: e.time,
    venue: e.venue,
    details: e.details,
    audience: e.audience,
    sortOrder: String(e.sortOrder),
  };
}

export default function AdminPanel({
  guests,
  events,
  databaseConnected,
  loadError,
}: {
  guests: GuestRow[];
  events: PreludeEvent[];
  databaseConnected: boolean;
  loadError: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  // Guests
  const [pasted, setPasted] = useState("");
  const [guestMessage, setGuestMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  // Events
  const [eventForm, setEventForm] = useState<EventForm>(emptyEventForm);
  const [eventMessage, setEventMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

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

  function saveEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEventMessage(null);
    startTransition(async () => {
      const result = await saveEventAction({
        id: eventForm.id || undefined,
        title: eventForm.title,
        date: eventForm.date || null,
        time: eventForm.time,
        venue: eventForm.venue,
        details: eventForm.details,
        audience: eventForm.audience,
        sortOrder: Number(eventForm.sortOrder) || 0,
      });
      if (!result.ok) {
        setEventMessage({ tone: "err", text: result.error });
        return;
      }
      setEventForm(emptyEventForm());
      setEventMessage({ tone: "ok", text: "Event saved." });
    });
  }

  function removeEvent(e: PreludeEvent) {
    if (!window.confirm(`Delete "${e.title}"?`)) return;
    setEventMessage(null);
    startTransition(async () => {
      const result = await deleteEventAction(e.id);
      if (!result.ok) setEventMessage({ tone: "err", text: result.error });
      else if (eventForm.id === e.id) setEventForm(emptyEventForm());
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6">
      <header>
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Admin</p>
        <h1 className="mt-2 font-display text-4xl font-medium text-maroon sm:text-5xl">Pre-wedding</h1>
      </header>

      {!databaseConnected ? (
        <p role="status" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          The database isn&rsquo;t connected yet. Add the Supabase variables in Vercel and redeploy.
        </p>
      ) : null}
      {loadError ? (
        <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          Couldn&rsquo;t load the guest list or events. Refresh to try again.
        </p>
      ) : null}

      {/* Guest list */}
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

      {/* Events */}
      <section aria-label="Events" className={`${cardClass} mt-8`}>
        <h2 className="font-display text-2xl text-maroon">Events</h2>
        <p className="mt-1 text-sm text-ink/70">
          &ldquo;Everyone&rdquo; events are visible to all visitors. &ldquo;Guests on the list&rdquo; events show only after a
          guest signs in with a number on the list.
        </p>

        <ul className="mt-4 divide-y divide-gold/20">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-ink/60">
                  {e.date ?? "Date TBA"}
                  {e.time ? ` · ${e.time}` : ""} · {e.audience === "everyone" ? "Everyone" : "Guests on the list"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEventForm(toForm(e))}
                className="text-maroon underline-offset-2 hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => removeEvent(e)}
                disabled={isPending}
                className="text-ink/60 underline-offset-2 hover:text-maroon hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={saveEvent} className="mt-6 grid gap-3 sm:grid-cols-6">
          <p className="text-sm font-medium text-ink sm:col-span-6">
            {eventForm.id ? "Edit event" : "Add event"}
          </p>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs text-ink/60">Title</label>
            <input required maxLength={80} value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className={inputClass} />
          </div>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs text-ink/60">Who can see it</label>
            <select value={eventForm.audience} onChange={(e) => setEventForm({ ...eventForm, audience: e.target.value as Audience })} className={inputClass}>
              <option value={AUDIENCES[0]}>Everyone</option>
              <option value={AUDIENCES[1]}>Guests on the list</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-ink/60">Date (optional)</label>
            <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-ink/60">Time</label>
            <input maxLength={40} placeholder="e.g. 10:00 AM onwards" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-ink/60">Order</label>
            <input type="number" min="0" max="999" value={eventForm.sortOrder} onChange={(e) => setEventForm({ ...eventForm, sortOrder: e.target.value })} className={inputClass} />
          </div>
          <div className="sm:col-span-6">
            <label className="mb-1 block text-xs text-ink/60">Venue</label>
            <input maxLength={120} value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} className={inputClass} />
          </div>
          <div className="sm:col-span-6">
            <label className="mb-1 block text-xs text-ink/60">Details</label>
            <textarea rows={3} maxLength={500} value={eventForm.details} onChange={(e) => setEventForm({ ...eventForm, details: e.target.value })} className={inputClass} />
          </div>

          {eventMessage ? (
            <p role="status" className={`text-sm sm:col-span-6 ${eventMessage.tone === "ok" ? "text-ink/70" : "text-maroon"}`}>
              {eventMessage.text}
            </p>
          ) : null}

          <div className="flex gap-2 sm:col-span-6">
            <button type="submit" disabled={isPending || !databaseConnected} className={primaryButton}>
              {eventForm.id ? "Save changes" : "Add event"}
            </button>
            {eventForm.id ? (
              <button type="button" onClick={() => setEventForm(emptyEventForm())} className={ghostButton}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}
