/** @type {import('next').NextConfig} */
const nextConfig = {
  // www <-> bare domain redirects are configured in Vercel (Settings > Domains),
  // not here, so the two can never fight each other and cause a redirect loop.
};

export default nextConfig;
