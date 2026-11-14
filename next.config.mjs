/** @type {import('next').NextConfig} */
const nextConfig = {
  // www <-> bare domain redirects are configured in Vercel (Settings > Domains),
  // not here, so the two can never fight each other and cause a redirect loop.

  // Keep the private expenses page out of search engines and caches.
  async headers() {
    return [
      {
        source: "/expenses",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/events/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/prelude/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
