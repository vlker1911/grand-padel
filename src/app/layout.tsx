import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://grandpadel.cz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Grand Padel — síť indoor padelových center",
    template: "%s | Grand Padel",
  },
  description: "Indoor padel v Olomouci, Ostravě a Praze (Zličín). Rezervace kurtů, turnaje, akademie.",
  applicationName: "Grand Padel",
  authors: [{ name: "Grand Padel" }],
  keywords: ["padel", "Olomouc", "Ostrava", "Praha", "Zličín", "indoor padel", "turnaje", "akademie", "rezervace kurtů"],
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    url: siteUrl,
    siteName: "Grand Padel",
    title: "Grand Padel — síť indoor padelových center",
    description: "Indoor padel v Olomouci, Ostravě a Praze (Zličín). Rezervace kurtů, turnaje, akademie.",
    images: [
      {
        url: "/photos/hero-homepage.jpg",
        width: 1200,
        height: 630,
        alt: "Grand Padel — indoor padel centra",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grand Padel — síť indoor padelových center",
    description: "Indoor padel v Olomouci, Ostravě a Praze (Zličín). Rezervace, turnaje, akademie.",
    images: ["/photos/hero-homepage.jpg"],
  },
  icons: {
    icon: "/gp-logo-monogram.png",
    apple: "/gp-logo-monogram.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        {children}
      </body>
    </html>
  );
}
