import type { Metadata } from "next";
import { databaseConfigured } from "../../lib/supabase";
import { findGuest, listEvents } from "../../lib/prelude-store";
import type { GuestRow, PreludeEvent } from "../../lib/prelude-types";
import { currentGuestPhone, preludeConfigured } from "../../lib/prelude-auth";
import GuestLogin from "./GuestLogin";
import { EventList } from "./EventList";

export const metadata: Metadata = {
  title: "Pre-wedding",
  robots: { index: false, follow: false },
};

// Depends on the guest cookie and live data, so never cache or pre-render it.
export const dynamic = "force-dynamic";

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
        <p className="fade-up text-xs uppercase tracking-[0.35em] text-gold" style={{ animationDelay: "0.05s" }}>
          Sai &amp; Harshitha
        </p>
        <h1
          className="fade-up mt-3 font-display text-5xl font-medium text-maroon sm:text-6xl"
          style={{ animationDelay: "0.15s" }}
        >
          Events
        </h1>
        <div aria-hidden className="draw-line mx-auto mt-6 h-px w-24 bg-gold/70" />
        {guest?.name ? (
          <p className="fade-up mt-4 text-sm text-ink/70" style={{ animationDelay: "0.4s" }}>
            Welcome, {guest.name}
          </p>
        ) : null}
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
        // Not signed in: only the form. Main events appear after a sign-in attempt.
        <div className="fade-up mt-10" style={{ animationDelay: "0.35s" }}>
          <GuestLogin mainEvents={mainEvents} />
        </div>
      ) : (
        <section aria-label="Events" className="mt-10">
          <EventList events={visible} />
        </section>
      )}
    </main>
  );
}
