import type { Metadata } from "next";
import { databaseConfigured } from "../../lib/supabase";
import { findGuest, listEvents } from "../../lib/prelude-store";
import type { GuestRow, PreludeEvent } from "../../lib/prelude-types";
import { currentGuestPhone, preludeConfigured } from "../../lib/prelude-auth";
import GuestLogin from "./GuestLogin";

export const metadata: Metadata = {
  title: "Pre-wedding",
  robots: { index: false, follow: false },
};

// Depends on the guest cookie and live data, so never cache or pre-render it.
export const dynamic = "force-dynamic";

function formatDate(value: string | null): string {
  if (!value) return "Date to be announced";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function EventList({ events }: { events: PreludeEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink/60">Details will be shared soon.</p>;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {events.map((e) => (
        <li key={e.id} className="rounded-2xl border border-gold/30 bg-white/60 p-5">
          <h3 className="font-display text-2xl text-maroon">{e.title}</h3>
          <p className="mt-2 text-sm text-ink/80">{formatDate(e.date)}</p>
          {e.time ? <p className="text-sm text-ink/80">{e.time}</p> : null}
          {e.venue ? <p className="mt-1 text-sm text-ink/70">{e.venue}</p> : null}
          {e.details ? <p className="mt-3 whitespace-pre-line text-sm text-ink/70">{e.details}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export default async function PreludePage() {
  const configured = preludeConfigured() && databaseConfigured();

  let events: PreludeEvent[] = [];
  let loadError = false;
  if (databaseConfigured()) {
    try {
      events = await listEvents();
    } catch {
      loadError = true;
    }
  }

  // A signed-in guest sees everything. Everyone else sees only the main events.
  let guest: GuestRow | null = null;
  const phone = configured ? await currentGuestPhone() : null;
  if (phone) {
    try {
      guest = await findGuest(phone);
    } catch {
      guest = null;
    }
  }
  const visible = guest ? events : events.filter((e) => e.audience === "everyone");
  const mainEvents = events.filter((e) => e.audience === "everyone");

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-12 sm:px-6">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Sai &amp; Harshitha</p>
        <h1 className="mt-3 font-display text-5xl font-medium text-maroon sm:text-6xl">
          {guest?.name ? `Welcome, ${guest.name}` : "Pre-wedding celebrations"}
        </h1>
      </header>

      {!configured ? (
        <p role="status" className="mt-10 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          This page isn&rsquo;t set up yet. Add the Supabase variables and PRELUDE_SESSION_SECRET
          in Vercel, then redeploy.
        </p>
      ) : null}
      {loadError ? (
        <p role="alert" className="mt-10 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          Couldn&rsquo;t load the events. Refresh the page to try again.
        </p>
      ) : null}

      {!guest ? (
        <div className="mt-10">
          <GuestLogin />
        </div>
      ) : null}

      <section aria-label="Events" className="mt-10">
        <h2 className="font-display text-3xl text-maroon">
          {guest ? "Your events" : "Main events"}
        </h2>
        <div className="mt-5">
          <EventList events={guest ? visible : mainEvents} />
        </div>
      </section>
    </main>
  );
}
