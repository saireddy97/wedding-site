# Sai & Harshitha Wedding Website

Next.js (App Router) + React + Tailwind CSS v4, built for Vercel.

Currently a "coming soon" page plus a private expense tracker. Planned next:

- `/` public wedding landing page (currently "coming soon")
- `/expenses` password-protected expense tracker (built, see setup below)
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

Add both `saiandharshiwedding.in` and `www.saiandharshiwedding.in` in Vercel. Pick which one is primary under Settings > Domains and set the other to redirect to it there (the code does not redirect, to avoid redirect loops).

## Expense tracker setup (`/expenses`)

The page is locked behind a password that is checked on the server. It needs one password and one database.

1. **Password:** In Vercel, open the project's **Settings > Environment Variables** and add `EXPENSES_PASSWORD` with a long, unique password (a passphrase of 4+ random words works well). Optionally add `EXPENSES_SESSION_SECRET` with any long random string; if you leave it out, the password itself is used to sign the login cookie.
2. **Database (Supabase):**
   1. Create a project at supabase.com (free plan).
   2. In the Supabase dashboard, open **SQL Editor**, paste the contents of `supabase/schema.sql`, and click **Run**. It creates the tables and locks them down. It's safe to run again. If you set this up before, running it again adds the remarks column and removes the old budget table.
   3. In **Project Settings > API**, copy the **Project URL** and the **secret** key (`sb_secret_...`, or the `service_role` key on older projects).
   4. In Vercel, add these environment variables: `SUPABASE_URL` (the Project URL) and `SUPABASE_SECRET_KEY` (the secret key). Never use a `NEXT_PUBLIC_` prefix for the secret key.
   
   Free projects pause after 1 week with no activity. Open the Supabase dashboard and restore the project if it's paused, especially before the wedding.
3. **Redeploy:** Environment variable changes only apply to new deployments, so trigger a redeploy (Deployments tab, the menu on the latest one, Redeploy).
4. Open `/expenses` and sign in.

How it is protected:

- Until `EXPENSES_PASSWORD` is set, the page shows "This page isn't available yet" and nothing else.
- Expense data is only read from the database after the password check passes, and every add, edit and delete re-checks the login on the server.
- The login is signed, `httpOnly` and `secure`. It ends after 30 minutes without activity, and each visit or action renews it. Changing the password (or the session secret) signs everyone out.
- After 5 wrong passwords from one IP address, that IP is locked out for 15 minutes.
- The page is marked `noindex` and is not linked from anywhere.

To change the password later, update `EXPENSES_PASSWORD` in Vercel and redeploy.

Local development: put the same variables in a `.env.local` file (it is git-ignored).

## Pre-wedding page (`/prelude`) and admin (`/prelude/admin`)

Guests enter their name and mobile number. If the number is on the guest list, they see all events, including the pre-wedding ones. Anyone else sees only the main events (Pellikuturu, Pellikoduku, Marriage).

Setup:

1. **Tables:** In Supabase SQL Editor, run `supabase/prelude-schema.sql`. It creates the guest and event tables and adds the three main events. Safe to run again.
2. **Variables:** In Vercel, add:
   - `PRELUDE_SESSION_SECRET`: a long random string, used to sign guest sessions.
   - `PRELUDE_ADMIN_PASSWORD`: the password for `/prelude/admin`. Changing it signs out the admin.
3. **Redeploy.**
4. Open `/prelude/admin`, sign in, and paste the guest numbers. Then edit the events (dates, times, venues, and who can see each one).

How it works:

- Numbers are matched on the 10 digits, so `+91`, spaces and a leading `0` all work.
- A guest's name is saved the first time they sign in. Later sign-ins don't change it.
- Guest sessions last 30 days. Sign-in attempts from one IP are limited to 5 misses per 15 minutes.
- The pages are marked `noindex`.
