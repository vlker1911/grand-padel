import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt – Grand Padel",
  description: "Kontaktujte Grand Padel – telefon, email, adresa, IČO.",
};

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
