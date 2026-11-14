"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

function HaldiHeader({ event }: { event: PreludeEvent }) {
  const parts = dateParts(event.date);
  return (
    <div
      className="relative min-h-[calc(100dvh-2rem)] w-full overflow-hidden rounded-2xl bg-cover bg-center sm:aspect-[896/1195] sm:min-h-0"
      style={{ backgroundImage: "url(/prelude/haldi-bg.jpg)", backgroundColor: "#fdf3d8" }}
    >
      <div className="absolute inset-x-0 top-[11%] flex flex-col items-center px-6 text-center sm:top-[14%]">
        <h3 id="event-dialog-title" className="font-display text-4xl italic text-[#3f7a3a] sm:text-6xl">
          Haldi Ceremony
        </h3>
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

export function EventList({ events }: { events: PreludeEvent[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = events.find((e) => e.id === openId) ?? null;

  // Escape closes the panel, and the page behind it doesn't scroll while it is open.
  useEffect(() => {
    if (openId === null) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpenId(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openId]);

  if (events.length === 0) {
    return <p className="fade-up text-sm text-ink/60">Details will be shared soon.</p>;
  }

  const isHaldi = open?.id === "haldi";

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {events.map((e, i) => (
          <li key={e.id} className="fade-up" style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
            <button
              type="button"
              onClick={() => setOpenId(e.id)}
              aria-haspopup="dialog"
              className="card-lift h-full w-full rounded-2xl border border-gold/30 bg-white/60 p-5 text-left"
            >
              <h3 className="font-display text-2xl text-maroon">{e.title}</h3>
              <p className="mt-2 text-sm text-ink/80">{formatDate(e.date)}</p>
              {e.time ? <p className="text-sm text-ink/80">{e.time}</p> : null}
              {e.venue ? <p className="mt-1 text-sm text-ink/70">{e.venue}</p> : null}
              <p className="mt-4 text-xs uppercase tracking-wider text-gold">Tap for details</p>
            </button>
          </li>
        ))}
      </ul>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-stretch justify-center bg-ink/40 sm:items-center sm:p-6"
              onClick={() => setOpenId(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="event-dialog-title"
                onClick={(ev) => ev.stopPropagation()}
                className={`fade-up relative h-[100dvh] w-full overflow-y-auto p-4 shadow-xl sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl sm:p-8 ${
                  isHaldi ? "bg-[#fdf7e3]" : "bg-cream"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  aria-label="Close"
                  autoFocus
                  className="absolute right-4 top-4 z-10 text-3xl leading-none text-ink/60 hover:text-maroon"
                >
                  ×
                </button>

                {isHaldi ? (
                  <HaldiHeader event={open} />
                ) : (
                  <>
                    <div
                      aria-hidden
                      className="mb-6 h-40 w-full rounded-2xl bg-cover bg-center"
                      style={{ backgroundImage: `url(/prelude/${open.id}.svg)`, backgroundColor: "#f3e7d3" }}
                    />
                    <h3 id="event-dialog-title" className="pr-8 font-display text-3xl text-maroon">
                      {open.title}
                    </h3>
                  </>
                )}

                <dl className="mt-6 grid gap-4 text-sm">
                  {!isHaldi ? <DetailRow label="Date" value={formatDate(open.date)} /> : null}
                  {!isHaldi && open.time ? <DetailRow label="Time" value={open.time} /> : null}
                  {!isHaldi && open.venue ? <DetailRow label="Venue" value={open.venue} /> : null}
                  {open.dressCode ? <DetailRow label="Dress code" value={open.dressCode} /> : null}
                </dl>

                {open.locationUrl ? (
                  <a
                    href={open.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-block rounded-full bg-maroon px-5 py-2 text-sm font-medium text-cream transition hover:bg-maroon/90"
                  >
                    Open location in Maps
                  </a>
                ) : null}

                {open.details ? (
                  <div className="mt-6 whitespace-pre-line border-t border-gold/30 pt-5 text-sm text-ink/80">
                    {open.details}
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
