/** @type {import('next').NextConfig} */
const nextConfig = {
  // Redirect www to the bare domain so guests always land on one version.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.saiandharshiwedding.in" }],
        destination: "https://saiandharshiwedding.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
