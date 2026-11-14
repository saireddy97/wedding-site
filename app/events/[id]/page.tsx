import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { databaseConfigured } from "../../../lib/supabase";
import { findGuest } from "../../../lib/prelude-store";
import type { GuestRow } from "../../../lib/prelude-types";
import { PRELUDE_EVENTS } from "../../../lib/prelude-events";
import { currentGuestPhone, preludeConfigured } from "../../../lib/prelude-auth";
import { EventBanner, EventExtras, HaldiHeader } from "../event-parts";

// Guest status is checked on every request, so never cache this page.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = PRELUDE_EVENTS.find((e) => e.id === id);
  return {
    title: event ? `${event.title} | Events` : "Events",
    robots: { index: false, follow: false },
  };
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const event = PRELUDE_EVENTS.find((e) => e.id === id);
  if (!event) notFound();

  // Guest-only events need a signed-in guest. Anyone else goes back to the Events page.
  if (event.audience === "guests") {
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
    if (!guest) redirect("/events");
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-16 pt-6 sm:max-w-lg sm:px-6">
      <Link href="/events" className="text-sm text-maroon underline-offset-2 hover:underline">
        ← All events
      </Link>

      <div className="mt-4">
        {event.id === "haldi" ? (
          <HaldiHeader event={event} />
        ) : (
          <>
            <EventBanner event={event} />
            <h1 className="font-display text-4xl text-maroon sm:text-5xl">{event.title}</h1>
          </>
        )}
        <div className="mt-6">
          <EventExtras event={event} />
        </div>
      </div>
    </main>
  );
}
