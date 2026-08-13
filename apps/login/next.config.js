/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@remat/ui", "@remat/config"],
};

module.exports = nextConfig;
