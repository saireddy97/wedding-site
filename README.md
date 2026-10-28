# Sai & Harshi Wedding Website

Next.js (App Router) + React + Tailwind CSS v4, built for Vercel.

Currently a "coming soon" page. Planned next:

- `/` public wedding landing page
- `/prelude` guest-only page (pre-wedding content, quests, leaderboard, Groom vs Bride scores), gated by phone number
- `/admin` password-protected dashboard

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New > Project**, import the repo, and deploy. No settings need changing (Vercel detects Next.js).
3. Open the project's **Settings > Domains** and add `saiandharshiwedding.in`.
4. Vercel shows the DNS records to add at your domain registrar (usually an A record for the root domain and a CNAME for `www`).
5. Wait for DNS to propagate. HTTPS is set up automatically.

`next.config.mjs` already redirects `www.saiandharshiwedding.in` to `saiandharshiwedding.in`, so add both domains in Vercel.
