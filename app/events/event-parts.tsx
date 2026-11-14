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

// Parts used by the Haldi invitation-style date block.
function dateParts(value: string | null) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return {
    weekday: date.toLocaleDateString("en-IN", { weekday: "long" }).toUpperCase(),
    day: String(d).padStart(2, "0"),
    month: date.toLocaleDateString("en-IN", { month: "long" }).toUpperCase(),
    year: String(y),
  };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-ink/60">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}

// Events whose invitation image already holds all of its details. Nothing is laid over these.
export const INVITE_IMAGES: Record<string, string> = {
  haldi: "/prelude/haldi-invite.png",
  sangeet: "/prelude/sangeet-invite.png",
};

export function InviteImage({ src, title }: { src: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-2xl">
      <h1 className="sr-only">{title}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${title} invitation`} className="block h-auto w-full" />
    </div>
  );
}

// Banner for events without their own artwork.
export function EventBanner({ event }: { event: PreludeEvent }) {
  return (
    <div
      aria-hidden
      className="h-44 w-full rounded-2xl bg-cover bg-center sm:h-60"
      style={{ backgroundImage: `url(/prelude/${event.id}.svg)`, backgroundColor: "#f3e7d3" }}
    />
  );
}

// Date, time, venue, dress code, map link and details. Haldi shows its date and venue on the artwork, so only the rest is listed here.
export function EventExtras({ event }: { event: PreludeEvent }) {
  const showCore = !INVITE_IMAGES[event.id];
  return (
    <div>
      {showCore || event.dressCode ? (
        <dl className="grid gap-4 text-sm">
          {showCore ? <DetailRow label="Date" value={formatDate(event.date)} /> : null}
          {showCore && event.time ? <DetailRow label="Time" value={event.time} /> : null}
          {showCore && event.venue ? <DetailRow label="Venue" value={event.venue} /> : null}
          {event.dressCode ? <DetailRow label="Dress code" value={event.dressCode} /> : null}
        </dl>
      ) : null}

      {event.locationUrl ? (
        <a
          href={event.locationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full bg-maroon px-5 py-2 text-sm font-medium text-cream transition hover:bg-maroon/90"
        >
          Open location in Maps
        </a>
      ) : null}

      {event.details ? (
        <div className="mt-6 whitespace-pre-line border-t border-gold/30 pt-5 text-sm text-ink/80">
          {event.details}
        </div>
      ) : null}
    </div>
  );
}
