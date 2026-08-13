/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@remat/ui", "@remat/config"]
};

module.exports = nextConfig;
