import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-mode "N" badge sits over the hero CTAs on phones.
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Inline the Tailwind stylesheet into the HTML. On throttled mobile an external
    // stylesheet shares the connection with the JS chunks and image preloads requested at the same moment, which
    // pushed first paint from ~0.7s to ~1.4s.
    inlineCss: true,
  },
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
