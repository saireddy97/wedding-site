export default function ComingSoon() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Soft decorative frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-4 rounded-[2rem] border border-gold/40 sm:inset-8"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-6 rounded-[1.5rem] border border-gold/20 sm:inset-10"
      />

      <div className="relative z-10 flex max-w-xl flex-col items-center">
        <p
          className="fade-up text-xs uppercase tracking-[0.4em] text-gold"
          style={{ animationDelay: "0.1s" }}
        >
          Save the date
        </p>

        <h1
          className="fade-up mt-8 font-display text-6xl font-medium leading-none text-maroon sm:text-8xl"
          style={{ animationDelay: "0.3s" }}
        >
          Sai
          <span className="mx-3 font-normal italic text-gold sm:mx-5">&amp;</span>
          Harshi
        </h1>

        <div
          aria-hidden
          className="fade-up mt-10 flex items-center gap-4"
          style={{ animationDelay: "0.5s" }}
        >
          <span className="h-px w-12 bg-gold/60" />
          <span className="text-gold">&#10086;</span>
          <span className="h-px w-12 bg-gold/60" />
        </div>

        <p
          className="fade-up mt-10 font-display text-lg italic text-ink/80 sm:text-2xl"
          style={{ animationDelay: "0.7s" }}
        >
          We&rsquo;re getting married, and our website is almost ready.
        </p>

        <p
          className="fade-up mt-4 text-sm tracking-wide text-ink/60"
          style={{ animationDelay: "0.9s" }}
        >
          Details coming soon
        </p>
      </div>

      <footer
        className="fade-up absolute bottom-10 text-xs tracking-[0.25em] text-ink/40 sm:bottom-14"
        style={{ animationDelay: "1.1s" }}
      >
        SAIANDHARSHIWEDDING.IN
      </footer>
    </main>
  );
}
