// Shared by the server page and the sign-in form. No hooks, so it works in both.
import type { PreludeEvent } from "../../lib/prelude-types";

export function formatDate(value: string | null): string {
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

export function EventList({ events }: { events: PreludeEvent[] }) {
  if (events.length === 0) {
    return <p className="fade-up text-sm text-ink/60">Details will be shared soon.</p>;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {events.map((e, i) => (
        <li
          key={e.id}
          className="fade-up"
          style={{ animationDelay: `${0.15 + i * 0.12}s` }}
        >
          <div className="card-lift h-full rounded-2xl border border-gold/30 bg-white/60 p-5">
            <h3 className="font-display text-2xl text-maroon">{e.title}</h3>
            <p className="mt-2 text-sm text-ink/80">{formatDate(e.date)}</p>
            {e.time ? <p className="text-sm text-ink/80">{e.time}</p> : null}
            {e.venue ? <p className="mt-1 text-sm text-ink/70">{e.venue}</p> : null}
            {e.details ? (
              <p className="mt-3 whitespace-pre-line text-sm text-ink/70">{e.details}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
