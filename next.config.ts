import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-mode "N" badge sits over the hero CTAs on phones.
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
