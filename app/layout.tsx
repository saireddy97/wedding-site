import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://saiandharshiwedding.in"),
  title: "Sai & Harshi | Coming Soon",
  description: "Sai & Harshi are getting married. Our wedding website is coming soon.",
  openGraph: {
    title: "Sai & Harshi",
    description: "Our wedding website is coming soon.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf5ec",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
