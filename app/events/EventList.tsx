import Link from "next/link";
import type { PreludeEvent } from "../../lib/prelude-types";
import { INVITE_IMAGES, formatDate } from "./event-parts";

// Events with an invitation image show it in full width. Tapping it opens the event's page.
// Other events show a text card that opens the same page.
export function EventList({ events }: { events: PreludeEvent[] }) {
  if (events.length === 0) {
    return <p className="fade-up text-sm text-ink/60">Details will be shared soon.</p>;
  }

  return (
    <ul className="flex flex-col gap-6">
      {events.map((e, i) => {
        const delay = { animationDelay: `${0.15 + i * 0.12}s` };
        const invite = INVITE_IMAGES[e.id];

        if (invite) {
          return (
            <li key={e.id} className="fade-up" style={delay}>
              <Link href={`/events/${e.id}`} className="card-lift block overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={invite} alt={`${e.title} invitation`} className="block h-auto w-full" />
              </Link>
            </li>
          );
        }

        return (
          <li key={e.id} className="fade-up" style={delay}>
            <Link
              href={`/events/${e.id}`}
              className="card-lift block rounded-2xl border border-gold/30 bg-white/60 p-5"
            >
              <h3 className="font-display text-2xl text-maroon">{e.title}</h3>
              <p className="mt-2 text-sm text-ink/80">{formatDate(e.date)}</p>
              {e.time ? <p className="text-sm text-ink/80">{e.time}</p> : null}
              {e.venue ? <p className="mt-1 text-sm text-ink/70">{e.venue}</p> : null}
              <p className="mt-4 text-xs uppercase tracking-wider text-gold">View details</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
