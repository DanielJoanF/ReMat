/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@remat/ui"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
