// Canonical site facts, shared by metadata, JSON-LD, robots, sitemap and the web manifest.

// Absolute origin for canonical URLs and social images. Set NEXT_PUBLIC_SITE_URL in production; Vercel's
// production domain is used automatically when deployed there.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE = {
  name: "Nitro",
  title: "Nitro — Zero Sugar Energy Drink",
  tagline: "Zero sugar. High intensity.",
  description:
    "Nitro energy drink: zero sugar, high intensity, producing since 2002. Five flavours — Green, Red, Sky, Blue and ENG.",
  foundingYear: "2002",
  accent: "#e0e600",
  locale: "en_US",
  currency: "USD",
} as const;
