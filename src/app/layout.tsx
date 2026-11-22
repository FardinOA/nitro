import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { SITE, SITE_URL } from "@/site";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "800"],
  // Not preloaded: a 41 KB high-priority preload competed with the render-blocking stylesheet on slow 4G and pushed
  // first paint back ~0.4s. Nothing set in Outfit is visible before the post-hydration intro, and the stylesheet's
  // @font-face starts the download at first layout anyway (hidden text still lays out), well ahead of hydration.
  preload: false,
});

// Icons, Open Graph and Twitter images come from the file conventions in this folder (favicon.ico, icon.png,
// apple-icon.png, opengraph-image.jpg, twitter-image.jpg + their .alt.txt), resolved against metadataBase.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE.title, template: `%s — ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["Nitro", "energy drink", "zero sugar", "sugar free energy drink", "Nitro Green", "Nitro Red", "Nitro Sky", "Nitro Blue", "Nitro ENG"],
  category: "food & drink",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    locale: SITE.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} antialiased`}>
      <head>
        {/* The can silhouette is a CSS mask, so no <img> names it. A plain <link> because ReactDOM.preload() from a
            prerendered server component only reaches the RSC payload, not the SSR <head>. (The hero can itself is
            preloaded by next/image.) crossOrigin matches mask-image's CORS fetch; without it the preload is discarded
            and the mask downloads twice.
            Default fetch priority on purpose: no image is the LCP (that's the wordmark text) and the can only shows
            once the post-hydration intro runs, so "high" just steals bandwidth from first paint — measured on
            throttled mobile: FCP/LCP ~775ms with the can, mask and label at high vs ~615ms at default.
            The label texture (label-panel.webp) is deliberately not preloaded: at default priority Chrome deferred
            it past where the canvas renderer would request it (3.8s vs 3.0s), and it added ~0.4s to Lighthouse's
            simulated LCP. */}
        <link rel="preload" as="image" type="image/webp" href="/figma/can-mask.webp" crossOrigin="anonymous" fetchPriority="auto" />
      </head>
      <body>{children}</body>
    </html>
  );
}
