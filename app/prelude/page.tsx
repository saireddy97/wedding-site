import type { Metadata } from "next";
import { databaseConfigured } from "../../lib/supabase";
import { findGuest } from "../../lib/prelude-store";
import type { GuestRow } from "../../lib/prelude-types";
import { PRELUDE_EVENTS } from "../../lib/prelude-events";
import { currentGuestPhone, preludeConfigured } from "../../lib/prelude-auth";
import GuestLogin from "./GuestLogin";
import { EventList } from "./EventList";

export const metadata: Metadata = {
  title: "Pre-wedding",
  robots: { index: false, follow: false },
};

// Depends on the guest cookie and the guest list, so never cache or pre-render it.
export const dynamic = "force-dynamic";

export default async function PreludePage() {
  const configured = preludeConfigured() && databaseConfigured();

  // Guest matching uses the database. The events themselves are static.
  let guest: GuestRow | null = null;
  const phone = configured ? await currentGuestPhone() : null;
  if (phone) {
    try {
      guest = await findGuest(phone);
    } catch {
      guest = null;
    }
  }

  // A signed-in guest sees everything. Everyone else sees only the main events.
  const mainEvents = PRELUDE_EVENTS.filter((e) => e.audience === "everyone");
  const visible = guest ? PRELUDE_EVENTS : mainEvents;

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
