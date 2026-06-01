import Link from "next/link";
import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import Navbar, { NAV_LINKS } from "@/components/Navbar";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Rezervace – Grand Padel",
  description: "Online rezervace kurtů Grand Padel – spouštíme v říjnu 2026 v Olomouci.",
};

const CENIK = [
  { den: "Po – Pá", cas: "7:00 – 10:00",  cena: "800 Kč / hod" },
  { den: "Po – Pá", cas: "10:00 – 16:00", cena: "700 Kč / hod" },
  { den: "Po – Pá", cas: "16:00 – 21:00", cena: "900 Kč / hod" },
  { den: "Po – Pá", cas: "21:00 – 23:00", cena: "800 Kč / hod" },
  { den: "So – Ne", cas: "7:00 – 23:00",  cena: "800 Kč / hod" },
];

const JAK = [
  { krok: "1", nadpis: "Vyberte datum a délku",  popis: "Den, délka hry (60–120 min) a část dne — ráno, odpoledne nebo večer." },
  { krok: "2", nadpis: "Zvolte volný slot",       popis: "Systém zobrazí dostupné časy. Jeden kliknutím zarezervujete." },
  { krok: "3", nadpis: "Zaplaťte online",          popis: "Platba kartou nebo kreditem. Potvrzení e-mailem okamžitě." },
  { krok: "4", nadpis: "Přijďte hrát",             popis: "Otevřeno každý den 7:00–23:00." },
];

export default function Rezervace() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">

        <PageHero
          badge="Spouštíme v říjnu 2026"
          title="Online rezervace kurtů"
          subtitle="Rezervační systém spustíme spolu s otevřením první haly v Olomouci. Zanechte e-mail a budete první, kdo si zahraje."
          photo="/photos/hero-action.jpg"
          photoAlt="Hráč padelu"
        />

        {/* Náhled dostupnosti — funkční preview mřížky volných kurtů (jen zobrazení, žádný zápis). */}
        <section className="py-10 px-4 text-center" style={{ backgroundColor: "#F2EDE4" }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#8C1325" }}>
              Chcete se podívat, kdy je volno?
            </h2>
            <p className="text-sm mb-5" style={{ color: "#6b7280" }}>
              Mřížka volných kurtů Olomouc — zatím jen pro náhled, rezervovat půjde s otevřením haly.
            </p>
            <Link
              href="/rezervace/dostupnost"
              className="inline-block rounded-full px-6 py-3 text-base font-semibold text-white transition-colors"
              style={{ backgroundColor: "#8C1325" }}
            >
              Zobrazit volné kurty
            </Link>
          </div>
        </section>

        {/* Jak to funguje */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "#8C1325" }}>Jak rezervace funguje</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {JAK.map((k) => (
                <div key={k.krok} className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: "#8C1325" }}>
                    {k.krok}
                  </div>
                  <h3 className="font-semibold" style={{ color: "#0A0A0A" }}>{k.nadpis}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{k.popis}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ceník */}
        <section className="py-16 px-4" style={{ backgroundColor: "#F2EDE4" }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "#8C1325" }}>Ceník — Olomouc</h2>
            <p className="text-center text-sm mb-8" style={{ color: "#6b7280" }}>Cena je za kurt za hodinu, bez ohledu na počet hráčů.</p>
            <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#8C1325", color: "#fff" }}>
                    <th className="text-left px-6 py-4 font-semibold">Den</th>
                    <th className="text-left px-6 py-4 font-semibold">Čas</th>
                    <th className="text-right px-6 py-4 font-semibold">Cena</th>
                  </tr>
                </thead>
                <tbody>
                  {CENIK.map((r, i) => (
                    <tr key={i} className="border-t border-zinc-100" style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td className="px-6 py-4 font-medium" style={{ color: "#0A0A0A" }}>{r.den}</td>
                      <td className="px-6 py-4" style={{ color: "#6b7280" }}>{r.cas}</td>
                      <td className="px-6 py-4 text-right font-semibold" style={{ color: "#8C1325" }}>{r.cena}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-center mt-4" style={{ color: "#9ca3af" }}>
              Přechází-li rezervace přes více cenových pásem, každá půlhodina se počítá dle svého pásma. Otevírací doba: každý den 7:00–23:00.
            </p>
          </div>
        </section>

        {/* Storno */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8" style={{ color: "#8C1325" }}>Storno podmínky</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-zinc-100 p-6">
                <div className="mb-3" style={{ color: "#16a34a" }}><Check size={32} strokeWidth={2} /></div>
                <h3 className="font-semibold mb-2" style={{ color: "#0A0A0A" }}>Více než 24 hodin předem</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>Rezervaci lze zrušit nebo přesunout. Zaplacená částka se vrátí do kreditu.</p>
              </div>
              <div className="rounded-2xl border border-zinc-100 p-6">
                <div className="mb-3" style={{ color: "#8C1325" }}><X size={32} strokeWidth={2} /></div>
                <h3 className="font-semibold mb-2" style={{ color: "#0A0A0A" }}>Méně než 24 hodin předem</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>Zrušení ani přesun není možný. Nevyužitá rezervace propadá.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-white text-center" style={{ backgroundColor: "#8C1325" }}>
          <h2 className="text-3xl font-bold mb-4">Chcete hrát jako první?</h2>
          <p className="mb-8 max-w-md mx-auto" style={{ color: "#f3c6ce" }}>Rezervace spouštíme v říjnu 2026 v Olomouci. Nechte nám e-mail a dáme vám vědět.</p>
          <Link href="/kontakt" className="rounded-full px-8 py-4 text-base font-semibold transition-colors bg-white" style={{ color: "#8C1325" }}>Mám zájem</Link>
        </section>
      </main>

      <footer className="py-10 px-4 text-sm" style={{ backgroundColor: "#0A0A0A", color: "#9ca3af" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="font-bold text-base mb-1 text-white">Grand Padel s.r.o.</p>
            <p>Nad Sokolovnou 534, 267 06 Hýskov</p>
            <p>info@grandpadel.cz · 722 918 191</p>
          </div>
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (<Link key={link.href} href={link.href} className="hover:text-white transition-colors">{link.label}</Link>))}
          </div>
          <div className="text-xs self-end" style={{ color: "#4b5563" }}>© {new Date().getFullYear()} Grand Padel s.r.o. Všechna práva vyhrazena.</div>
        </div>
      </footer>
    </div>
  );
}
