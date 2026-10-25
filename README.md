# Royal Wedding Website

A responsive, royal Indian wedding website built with Astro, TypeScript, Tailwind CSS v4, and GitHub Pages. It is a static site: no server, database, WhatsApp Business account, or API key is required for the initial version.

## Included

- Invitation landing page and configurable countdown
- Event schedule and venue links
- Announcement feed
- Photo gallery
- Regular WhatsApp share links (opens WhatsApp with a prepared message; you choose whom to send it to)
- GitHub Actions deployment to GitHub Pages
- Responsive styling and reduced-motion support

## Requirements

- Node.js 22 or newer
- npm
- A GitHub account

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

After editing a JSON file, commit and push to the `main` branch. GitHub Actions will rebuild and publish the site.

## Deploy to GitHub Pages

1. In the GitHub repository, open **Settings > Pages** and select **GitHub Actions** as the source under **Build and deployment**.
2. The included `.github/workflows/deploy.yml` builds Astro and deploys the `dist/` output whenever you push to `main`.
3. Open the **Actions** tab and wait for **Deploy to GitHub Pages** to succeed. The published URL is `https://saireddy97.github.io/wedding-site/`.

The Astro config automatically uses the repository path for GitHub Pages and the project path for GitLab Pages. For a custom domain, set `SITE_BASE_PATH` to `/` and `SITE_URL` to the full HTTPS domain, then add the domain under **Settings > Pages** and configure the DNS records GitHub specifies.

## Suggested domain setup

- Add your domain in the GitHub Pages settings and follow GitHub's DNS instructions.
- Enable HTTPS in Pages settings after DNS verification. DNS propagation can take time.
- Keep the domain in `SITE_URL` and use `SITE_BASE_PATH=/` for a custom domain.

## Important privacy note

GitHub Pages serves static files that are publicly accessible. **Do not put private family schedules, phone numbers, addresses, or other sensitive content in this repository** if the site is public. Hiding a link or creating an obscure page is not access control. A genuine family-only area requires a separate authentication and authorization service or a different protected hosting approach.

## Image note

The gallery uses sample image URLs for layout demonstration. Replace them with your own images or appropriately licensed images before publishing. External images require an internet connection and may change or disappear; for a fully self-contained site, place optimized images in `public/images/` and reference them with paths such as `/images/photo-01.jpg` (or ensure paths work with the configured base path).

## Cost note

GitHub Pages can provide free static hosting subject to GitHub's current plan limits. You still pay for your domain and any optional third-party services. Check GitHub's current Pages usage limits and terms before launch.
