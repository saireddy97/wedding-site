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
    weekday: date.toLocaleDateString("en-IN", { weekday: "long" }),
    day: String(d),
    monthYear: date.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
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

// A row of marigold blooms along a gentle curve. Drawn here, not copied from any artwork.
function MarigoldGarland({ className }: { className?: string }) {
  const count = 11;
  const blooms = Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const x = 400 * t;
    const y = (1 - t) * (1 - t) * 14 + 2 * t * (1 - t) * 58 + t * t * 14;
    return { x, y, r: i % 2 === 0 ? 11 : 9 };
  });
  return (
    <svg viewBox="0 0 400 70" className={className} aria-hidden preserveAspectRatio="none">
      <path d="M0 14 Q200 58 400 14" fill="none" stroke="#6b8e23" strokeWidth="3" />
      {blooms.map((b, i) => (
        <g key={i}>
          <ellipse cx={b.x - 9} cy={b.y + 6} rx="9" ry="4" fill="#7fae3a" opacity="0.85" transform={`rotate(-25 ${b.x - 9} ${b.y + 6})`} />
          <ellipse cx={b.x + 9} cy={b.y + 6} rx="9" ry="4" fill="#7fae3a" opacity="0.85" transform={`rotate(25 ${b.x + 9} ${b.y + 6})`} />
          <circle cx={b.x} cy={b.y} r={b.r} fill="#f29c1f" />
          <circle cx={b.x} cy={b.y} r={b.r * 0.55} fill="#ffd34d" />
        </g>
      ))}
    </svg>
  );
}

function HaldiHeader({ event }: { event: PreludeEvent }) {
  const parts = dateParts(event.date);
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#ffe9a0] to-[#fdf7e3] px-5 pb-10 pt-12 text-center ring-1 ring-[#e0b34a]/60">
      <MarigoldGarland className="absolute left-0 top-0 h-14 w-full" />
      <h3 id="event-dialog-title" className="font-display text-5xl italic text-[#5f8a1f]">
        Haldi
      </h3>

      {parts ? (
        <div className="mt-6 flex items-center justify-center gap-4 text-[#7a1f2b]">
          <div className="text-right">
            <p className="font-display text-lg leading-tight">{parts.weekday}</p>
          </div>
          <div className="rounded-md border-2 border-[#5f8a1f] bg-white/60 px-4 py-1">
            <p className="font-display text-4xl leading-tight text-[#5f8a1f]">{parts.day}</p>
          </div>
          <div>
            <p className="font-display text-lg leading-tight">{parts.monthYear}</p>
          </div>
        </div>
      ) : null}

      {event.time ? (
        <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#6b4a1a]">{event.time}</p>
      ) : null}

      {event.venue ? (
        <div className="mt-5">
          <p className="font-display text-2xl italic text-[#5f8a1f]">Venue</p>
          <p className="mt-1 text-sm text-[#5a3d1a]">{event.venue}</p>
        </div>
      ) : null}

      <MarigoldGarland className="absolute bottom-0 left-0 h-14 w-full rotate-180" />
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
              className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6"
              onClick={() => setOpenId(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="event-dialog-title"
                onClick={(ev) => ev.stopPropagation()}
                className={`fade-up relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl p-6 shadow-xl sm:max-w-lg sm:rounded-3xl sm:p-8 ${
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
