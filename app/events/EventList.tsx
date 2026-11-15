import Link from "next/link";
import type { PreludeEvent } from "../../lib/prelude-types";
import { INVITE_IMAGES, formatDate } from "./event-parts";
import { Reveal } from "./Reveal";

// Events with an invitation image show it in full width. Other events show a text card.
// Both open the event's page, and each one animates in as it scrolls into view.
export function EventList({ events }: { events: PreludeEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink/60">Details will be shared soon.</p>;
  }

  return (
    <ul className="flex flex-col gap-6">
      {events.map((e, i) => {
        const invite = INVITE_IMAGES[e.id];
        const delay = Math.min(i * 0.08, 0.32);

        return (
          <li key={e.id}>
            <Reveal delay={delay}>
              {invite ? (
                <Link href={`/events/${e.id}`} className="card-lift block overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={invite.src}
                    width={invite.width}
                    height={invite.height}
                    alt={`${e.title} invitation`}
                    className="block h-auto w-full"
                  />
                </Link>
              ) : (
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
              )}
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}
