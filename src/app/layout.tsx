import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Brand fonty — Bandeja (nadpisy) + Mluvka (text), Fungi Type, self-hosted.
// Zdroj: /vizual/manual-final-2026-05-23/typografie/, soubory v /public/fonts/.
const bandeja = localFont({
  variable: "--font-bandeja",
  display: "swap",
  src: [
    { path: "./fonts/bandeja/Bandeja-Regular-web.woff2",  weight: "400", style: "normal" },
    { path: "./fonts/bandeja/Bandeja-Medium-web.woff2",   weight: "500", style: "normal" },
    { path: "./fonts/bandeja/Bandeja-SemiBold-web.woff2", weight: "600", style: "normal" },
    { path: "./fonts/bandeja/Bandeja-Bold-web.woff2",     weight: "700", style: "normal" },
  ],
});

const mluvka = localFont({
  variable: "--font-mluvka",
  display: "swap",
  src: [
    { path: "./fonts/mluvka/Mluvka-Book-web.woff2",     weight: "300", style: "normal" },
    { path: "./fonts/mluvka/Mluvka-Regular-web.woff2",  weight: "400", style: "normal" },
    { path: "./fonts/mluvka/Mluvka-Medium-web.woff2",   weight: "500", style: "normal" },
    { path: "./fonts/mluvka/Mluvka-SemiBold-web.woff2", weight: "600", style: "normal" },
    { path: "./fonts/mluvka/Mluvka-Bold-web.woff2",     weight: "700", style: "normal" },
  ],
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
    icon: "/logos/gp-red.png",
    apple: "/logos/gp-red.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className={`${bandeja.variable} ${mluvka.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        {children}
      </body>
    </html>
  );
}
