import type { Metadata } from "next";
import { PRELUDE_EVENTS } from "../../lib/prelude-events";
import { EventList } from "./EventList";

export const metadata: Metadata = {
  title: "Events | Sai & Harshitha",
  robots: { index: false, follow: false },
};

// The events are open to anyone with the link. No sign-in is needed.
export default function EventsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-12 sm:px-6">
      <header className="text-center">
        <p className="fade-up text-xs uppercase tracking-[0.35em] text-gold" style={{ animationDelay: "0.05s" }}>
          Sai &amp; Harshitha
        </p>
        <h1
          className="fade-up mt-3 font-display text-5xl font-medium text-maroon sm:text-6xl"
          style={{ animationDelay: "0.15s" }}
        >
          Events
        </h1>
        <div aria-hidden className="draw-line mx-auto mt-6 h-px w-24 bg-gold/70" />
      </header>

      <section aria-label="Events" className="mx-auto mt-10 max-w-md sm:max-w-lg">
        <EventList events={PRELUDE_EVENTS} />
      </section>
    </main>
  );
}
