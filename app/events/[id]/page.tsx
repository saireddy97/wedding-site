import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { databaseConfigured } from "../../../lib/supabase";
import { findGuest } from "../../../lib/prelude-store";
import type { GuestRow } from "../../../lib/prelude-types";
import { PRELUDE_EVENTS } from "../../../lib/prelude-events";
import { currentGuestPhone, preludeConfigured } from "../../../lib/prelude-auth";
import { EventBanner, EventExtras, INVITE_IMAGES, InviteImage } from "../event-parts";

// Guest status is checked on every request, so never cache this page.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = PRELUDE_EVENTS.find((e) => e.id === id);
  return {
    title: event ? `${event.title} | Events` : "Events",
    robots: { index: false, follow: false },
  };
}

export default async function EventPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { from } = await searchParams;
  const event = PRELUDE_EVENTS.find((e) => e.id === id);
  if (!event) notFound();

  const configured = preludeConfigured() && databaseConfigured();
  const phone = configured ? await currentGuestPhone() : null;
  let guest: GuestRow | null = null;
  if (phone) {
    try {
      guest = await findGuest(phone);
    } catch {
      guest = null;
    }
  }

  // Guest-only events need a signed-in guest. Anyone else goes back to the Events page.
  if (event.audience === "guests" && !guest) redirect("/events");

  // Previous and next events, limited to the ones this visitor can see.
  const visible = guest ? PRELUDE_EVENTS : PRELUDE_EVENTS.filter((e) => e.audience === "everyone");
  const index = visible.findIndex((e) => e.id === event.id);
  const prev = index > 0 ? visible[index - 1] : null;
  const next = index >= 0 && index < visible.length - 1 ? visible[index + 1] : null;

  // Going back slides in from the left. Going forward (or arriving from the list) slides in from the right.
  const slide = from === "prev" ? "page-in-left" : "page-in-right";

  return (
    <main className={`${slide} mx-auto max-w-md px-4 pb-16 pt-6 sm:max-w-lg sm:px-6`}>
      <Link href="/events" className="text-sm text-maroon underline-offset-2 hover:underline">
        ← All events
      </Link>

      <div className="rise-in mt-4" style={{ animationDelay: "0.15s" }}>
        {INVITE_IMAGES[event.id] ? (
          <InviteImage invite={INVITE_IMAGES[event.id]} title={event.title} />
        ) : (
          <>
            <EventBanner event={event} />
            <h1 className="font-display text-4xl text-maroon sm:text-5xl">{event.title}</h1>
          </>
        )}
      </div>

      <div className="rise-in mt-6" style={{ animationDelay: "0.35s" }}>
        <EventExtras event={event} />
      </div>

      <nav
        aria-label="Other events"
        className="mt-10 flex items-center justify-between gap-4 border-t border-gold/30 pt-6 text-sm"
      >
        {prev ? (
          <Link
            href={`/events/${prev.id}?from=prev`}
            className="text-maroon underline-offset-2 hover:underline"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/events/${next.id}?from=next`}
            className="ml-auto text-maroon underline-offset-2 hover:underline"
          >
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
