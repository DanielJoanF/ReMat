const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@remat/ui", "@remat/config"],
  images: {
    domains: ["storage.remat.id", "images.unsplash.com"],
  },
};

module.exports = nextConfig;
