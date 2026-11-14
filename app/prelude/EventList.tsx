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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-ink/60">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
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
                className="fade-up max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-cream p-6 shadow-xl sm:max-w-lg sm:rounded-3xl sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 id="event-dialog-title" className="font-display text-3xl text-maroon">
                    {open.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpenId(null)}
                    aria-label="Close"
                    autoFocus
                    className="text-3xl leading-none text-ink/60 hover:text-maroon"
                  >
                    ×
                  </button>
                </div>

                <dl className="mt-6 grid gap-4 text-sm">
                  <DetailRow label="Date" value={formatDate(open.date)} />
                  {open.time ? <DetailRow label="Time" value={open.time} /> : null}
                  {open.venue ? <DetailRow label="Venue" value={open.venue} /> : null}
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
