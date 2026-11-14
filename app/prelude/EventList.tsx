import Link from "next/link";
import type { PreludeEvent } from "../../lib/prelude-types";
import { formatDate } from "./event-parts";

// Each card opens the event's own page.
export function EventList({ events }: { events: PreludeEvent[] }) {
  if (events.length === 0) {
    return <p className="fade-up text-sm text-ink/60">Details will be shared soon.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {events.map((e, i) => (
        <li key={e.id} className="fade-up" style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
          <Link
            href={`/prelude/${e.id}`}
            className="card-lift block h-full rounded-2xl border border-gold/30 bg-white/60 p-5"
          >
            <h3 className="font-display text-2xl text-maroon">{e.title}</h3>
            <p className="mt-2 text-sm text-ink/80">{formatDate(e.date)}</p>
            {e.time ? <p className="text-sm text-ink/80">{e.time}</p> : null}
            {e.venue ? <p className="mt-1 text-sm text-ink/70">{e.venue}</p> : null}
            <p className="mt-4 text-xs uppercase tracking-wider text-gold">View details</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
