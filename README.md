# Royal Wedding Website

A responsive, royal Indian wedding website built with Astro, TypeScript, Tailwind CSS v4, and GitLab Pages. It is a static site: no server, database, WhatsApp Business account, or API key is required for the initial version.

## Included

- Invitation landing page and configurable countdown
- Event schedule and venue links
- Announcement feed
- Photo gallery
- Regular WhatsApp share links (opens WhatsApp with a prepared message; you choose whom to send it to)
- GitLab CI/CD deployment to GitLab Pages
- Responsive styling and reduced-motion support

## Requirements

- Node.js 22 or newer
- npm
- A GitLab account

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Astro prints in the terminal. To test the production build:

```bash
npm run build
npm run preview
```

## Personalize the content

Edit the JSON files in `src/data/`:

- `site.json`: couple names, wedding date, invitation text, story, venue and map link
- `events.json`: event names, dates, times, venues, dress codes and descriptions
- `announcements.json`: newest wedding updates
- `gallery.json`: photo URLs, alt text and captions

Use an ISO date such as `2027-02-14` for `weddingDate`. Leave it as an empty string until the date is confirmed. The countdown appears only when the date is set. Dates for individual events are display text and can be formatted as you prefer.

After editing a JSON file, commit and push to the default branch. GitLab CI/CD will rebuild and publish the site.

## Deploy to GitLab Pages

1. Create a **blank project** on GitLab, for example `our-wedding`.
2. Add this project's files to the repository and push them to the project's default branch.
3. Ensure GitLab CI/CD is enabled for the project. The included `.gitlab-ci.yml` builds Astro and publishes the `dist/` output as the Pages artifact.
4. Open **Build > Pipelines** and wait for the `pages` job to succeed.
5. Open **Deploy > Pages** (the exact menu wording can vary) to find your live Pages URL.

The Astro config uses `/<project-name>/` as the default base path on GitLab CI, which supports the normal project Pages URL. For a custom domain, add `SITE_BASE_PATH` as a CI/CD variable with the value `/`, then add and verify the domain under the project's Pages settings and configure the DNS records GitLab specifies. If you use a custom domain, set `SITE_URL` to the full HTTPS domain, for example `https://ourwedding.in`.

If the project is a user/group Pages site published at the root of `namespace.gitlab.io`, set `SITE_BASE_PATH=/` in CI/CD variables as well.

## Suggested domain setup

- Buy a domain from a registrar you trust.
- Add it in the GitLab Pages settings first and follow GitLab's exact DNS instructions.
- Enable HTTPS in Pages settings after DNS verification. DNS propagation can take time.
- Keep the domain in `SITE_URL` and use `SITE_BASE_PATH=/` for a custom domain.

## Important privacy note

GitLab Pages serves static public files. **Do not put private family schedules, phone numbers, addresses, or other sensitive content in this repository** if the site is public. Hiding a link or creating an obscure page is not access control. A genuine family-only area requires a separate authentication and authorization service or a different protected hosting approach.

## Image note

The gallery uses sample image URLs for layout demonstration. Replace them with your own images or appropriately licensed images before publishing. External images require an internet connection and may change or disappear; for a fully self-contained site, place optimized images in `public/images/` and reference them with paths such as `/images/photo-01.jpg` (or ensure paths work with the configured base path).

## Cost note

GitLab Pages can provide free static hosting subject to GitLab's current plan limits. You still pay for your domain and any optional third-party services. Check GitLab's current Pages usage limits and terms before launch.
