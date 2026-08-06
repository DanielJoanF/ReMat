const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@remat/ui", "@remat/config"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
    domains: ["images.unsplash.com", "gfvfwuybqscjdngtllrw.supabase.co", "via.placeholder.com", "storage.remat.id"],
  },
};

module.exports = nextConfig;
