import type { Metadata } from "next";
import Link from "next/link";
import { databaseConfigured } from "../../lib/supabase";
import { findGuest } from "../../lib/prelude-store";
import type { GuestRow } from "../../lib/prelude-types";
import { currentGuestPhone, preludeConfigured } from "../../lib/prelude-auth";
import GuestLogin from "./GuestLogin";

export const metadata: Metadata = {
  title: "Games | Sai & Harshitha",
  robots: { index: false, follow: false },
};

// Depends on the guest cookie and the guest list, so never cache or pre-render it.
export const dynamic = "force-dynamic";

export default async function PreludePage() {
  const configured = preludeConfigured() && databaseConfigured();

  let guest: GuestRow | null = null;
  const phone = configured ? await currentGuestPhone() : null;
  if (phone) {
    try {
      guest = await findGuest(phone);
    } catch {
      guest = null;
    }
  }

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
          Games
        </h1>
        <div aria-hidden className="draw-line mx-auto mt-6 h-px w-24 bg-gold/70" />
      </header>

      {!configured ? (
        <p role="status" className="mt-10 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          This page isn&rsquo;t set up yet. Add the Supabase variables and PRELUDE_SESSION_SECRET
          in Vercel, then redeploy.
        </p>
      ) : null}

      {!guest ? (
        <div className="fade-up mx-auto mt-10 max-w-md" style={{ animationDelay: "0.35s" }}>
          <GuestLogin />
        </div>
      ) : (
        <section aria-label="Games" className="fade-up mx-auto mt-10 max-w-md text-center" style={{ animationDelay: "0.35s" }}>
          {guest.name ? (
            <>
              <p className="font-display text-3xl italic text-maroon">Dear {guest.name},</p>
              <p className="mt-2 text-base text-ink/80">Thank you for joining us</p>
            </>
          ) : null}
          <div className="mt-8 rounded-2xl border border-gold/30 bg-white/60 p-6">
            <p className="font-display text-2xl text-maroon">Games coming soon</p>
            <p className="mt-2 text-sm text-ink/70">The games will be posted here.</p>
          </div>
          <Link href="/events" className="mt-6 inline-block text-sm text-maroon underline-offset-2 hover:underline">
            See the events →
          </Link>
        </section>
      )}
    </main>
  );
}
