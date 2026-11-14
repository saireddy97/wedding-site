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

// The Haldi artwork with the event details on it. Its aspect ratio is fixed, so it is never stretched.
export function HaldiHeader({ event }: { event: PreludeEvent }) {
  const parts = dateParts(event.date);
  return (
    <div
      className="relative aspect-[896/1195] w-full overflow-hidden rounded-2xl bg-cover bg-center"
      style={{ backgroundImage: "url(/prelude/haldi-bg.jpg)" }}
    >
      <div className="absolute inset-x-0 top-[11%] flex flex-col items-center px-6 text-center sm:top-[14%]">
        <h1 className="font-display text-4xl italic text-[#3f7a3a] sm:text-6xl">Haldi Ceremony</h1>
        <p className="mt-2 font-display text-3xl text-[#b5561c] sm:mt-3 sm:text-5xl">Sai &amp; Harshitha</p>

        {parts ? (
          <div className="mt-4 flex w-full max-w-xs items-center justify-center gap-4 border-y border-dashed border-[#b5561c]/70 py-2 text-[#5a3a2a] sm:mt-6 sm:py-3">
            <div className="text-right">
              <p className="text-sm tracking-[0.2em]">{parts.month}</p>
            </div>
            <div className="px-2 text-center">
              <p className="font-display text-4xl leading-none text-[#3a5a3a] sm:text-5xl">{parts.day}</p>
              <p className="mt-1 text-sm tracking-[0.2em]">{parts.year}</p>
            </div>
            <div className="text-left">
              <p className="text-sm tracking-[0.2em]">{parts.weekday}</p>
            </div>
          </div>
        ) : null}

        {event.time ? (
          <p className="mt-4 text-sm uppercase tracking-[0.15em] text-[#5a3a2a]">{event.time}</p>
        ) : null}

        {event.venue ? (
          <div className="mt-5">
            <p className="font-display text-2xl text-[#b5561c]">:: Venue ::</p>
            <p className="mt-1 text-sm uppercase tracking-wide text-[#5a3a2a]">{event.venue}</p>
          </div>
        ) : null}
      </div>
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
  const isHaldi = event.id === "haldi";
  const showCore = !isHaldi;
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
