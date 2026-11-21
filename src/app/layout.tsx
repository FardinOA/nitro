import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "Nitro — Energy Drink",
  description: "Nitro energy drink. Zero sugar, high intensity. Producing since 2002.",
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
