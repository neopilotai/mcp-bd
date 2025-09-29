/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => {
    return [
      {
        source: "/popular",
        destination: "/rules/popular",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "cdn.brandfetch.io",
      },
      {
        hostname: "pbs.twimg.com",
      },
      {
        hostname: "midday.ai",
      },
      {
        hostname: "pub-abe1cd4008f5412abb77357f87d7d7bb.r2.dev",
      },
    ],
  },
};

export default nextConfig;
