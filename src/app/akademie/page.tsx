import Link from "next/link";
import type { Metadata } from "next";
import { Sprout, TrendingUp, Trophy, Baby } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Navbar, { NAV_LINKS } from "@/components/Navbar";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Akademie – Grand Padel",
  description: "Padel akademie Grand Padel – tréninky pro všechny úrovně. Spouštíme v říjnu 2026.",
};

const UROVNE: { Icon: LucideIcon; nadpis: string; popis: string; obsah: string[] }[] = [
  { Icon: Sprout,     nadpis: "Začátečníci",       popis: "Nikdy jste nesáhli na padelovou raketu? Nevadí. Za 2–3 hodiny pochopíte pravidla a zahrajete si plnohodnotný zápas.", obsah: ["Základy drilu a pohybu", "Servis a return", "Pravidla hry", "První skupinový trénink"] },
  { Icon: TrendingUp, nadpis: "Středně pokročilí", popis: "Hrajete, ale chcete posunout techniku a taktiku. Zaměříme se na slabá místa a přidáme závodní prvky.",              obsah: ["Technická analýza", "Taktika čtyřhry", "Smečování a obrana", "Tréninkové zápasy"] },
  { Icon: Trophy,     nadpis: "Pokročilí",         popis: "Hrajete turnaje nebo o ně usilujete. Individuální přístup, videoanalýza, příprava na soutěže.",                      obsah: ["Individuální trénink", "Videoanalýza zápasů", "Turnajová příprava", "Kondiční trénink"] },
  { Icon: Baby,       nadpis: "Děti & mládež",     popis: "Padel je ideální sport pro děti — rychle se naučí, bezpečné prostředí, skvělá parta.",                              obsah: ["Od 7 let", "Hrová forma tréninku", "Skupinky dle věku", "Mládežnické turnaje"] },
];

export default function Akademie() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">

        <PageHero
          badge="Spouštíme v říjnu 2026 — Olomouc"
          title="Grand Padel Akademie"
          subtitle="Tréninky s certifikovanými trenéry pro všechny úrovně — od prvního kurtu až po turnajovou přípravu."
          photo="/photos/academy.jpg"
          photoAlt="Padel trénink"
        />

        {/* Úrovně */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "#801A28" }}>Tréninky pro každého</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {UROVNE.map((u) => (
                <div key={u.nadpis} className="rounded-2xl border border-zinc-100 p-6 hover:shadow-md transition-shadow flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span style={{ color: "#801A28" }}><u.Icon size={32} strokeWidth={1.5} /></span>
                    <h3 className="text-lg font-semibold" style={{ color: "#0A0A0A" }}>{u.nadpis}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{u.popis}</p>
                  <ul className="flex flex-col gap-1 mt-auto">
                    {u.obsah.map((bod) => (
                      <li key={bod} className="flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
                        <span style={{ color: "#801A28" }}>→</span>{bod}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trenéři */}
        <section className="py-16 px-4" style={{ backgroundColor: "#F2EDE4" }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#801A28" }}>Naši trenéři</h2>
            <p className="text-lg leading-relaxed mb-8" style={{ color: "#6b7280" }}>
              Tým trenérů Grand Padel Akademie připravujeme. Pracujeme s certifikovanými padelovými trenéry s mezinárodními zkušenostmi. Detaily zveřejníme před otevřením.
            </p>
            <div className="rounded-2xl p-8 border border-zinc-200 bg-white">
              <p className="text-sm font-medium mb-1" style={{ color: "#801A28" }}>Chcete trénovat u nás?</p>
              <p className="text-sm mb-4" style={{ color: "#6b7280" }}>Hledáme certifikované trenéry padelu pro Olomouc, Ostravu i Prahu. Ozvěte se.</p>
              <Link href="/kontakt" className="inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: "#801A28" }}>
                Kontaktovat nás
              </Link>
            </div>
          </div>
        </section>

        {/* Statistiky */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 text-center">
            {[
              { num: "4",     label: "úrovně tréninku",  sub: "od úplných začátečníků po pokročilé" },
              { num: "7:00",  label: "– 23:00",           sub: "tréninky každý den" },
              { num: "3×",    label: "haly do 2027",      sub: "Olomouc, Ostrava, Praha Zličín" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-4xl font-extrabold" style={{ color: "#801A28" }}>{s.num}</span>
                <span className="font-semibold" style={{ color: "#0A0A0A" }}>{s.label}</span>
                <span className="text-sm" style={{ color: "#9ca3af" }}>{s.sub}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-white text-center" style={{ backgroundColor: "#801A28" }}>
          <h2 className="text-3xl font-bold mb-4">Začněte hrát ještě letos</h2>
          <p className="mb-8 max-w-md mx-auto" style={{ color: "#f3c6ce" }}>Akademie startuje s otevřením haly v Olomouci — říjen 2026. Zanechte e-mail a dáme vám vědět jako prvním.</p>
          <Link href="/kontakt" className="rounded-full px-8 py-4 text-base font-semibold transition-colors bg-white" style={{ color: "#801A28" }}>Mám zájem</Link>
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
