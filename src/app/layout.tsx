import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import localFont from "next/font/local";
import { SITE, SITE_URL } from "@/site";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "800"],
});

const sakana = localFont({
  variable: "--font-sakana",
  src: "../fonts/Sakana.ttf",
  display: "swap",
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
    <html lang="en" className={`${outfit.variable} ${sakana.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
