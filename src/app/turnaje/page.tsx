import Link from "next/link";
import type { Metadata } from "next";
import { Trophy, CalendarDays, Users, Star, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Navbar, { NAV_LINKS } from "@/components/Navbar";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Turnaje – Grand Padel",
  description: "Turnaje a ligy Grand Padel – přihlaste se k odběru novinek.",
};

const FORMATY: { Icon: LucideIcon; nadpis: string; popis: string }[] = [
  { Icon: Trophy,       nadpis: "Grand Padel Open",         popis: "Otevřené turnaje pro všechny úrovně. Přihlásit se můžete i jako jednotlivec — dáme vás do páru." },
  { Icon: CalendarDays, nadpis: "Ligy",                     popis: "Pravidelná ligová soutěž. Hrajete každý týden se stejnými soupeři, sbíráte body, postoupíte nebo sestoupíte." },
  { Icon: Users,        nadpis: "Firemní turnaje",          popis: "Turnaje na míru pro firmy a týmy. Ideální teambuilding — padel vtáhne každého." },
  { Icon: Star,         nadpis: "Exhibice na center kurtu", popis: "Každá naše hala má center kurt s tribunami. Sledujte nejlepší hráče zblízka." },
];

export default function Turnaje() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">

        <PageHero
          badge="Od října 2026 — Olomouc"
          title="Turnaje & ligy"
          subtitle="Padel je nejlepší ve čtyřech — ale komunita, která ho obklopuje, je to, co vás vtáhne. Přihlaste se k odběru a jako první se dozvíte, kdy zahajujeme."
          photo="/photos/tournament.jpg"
          photoAlt="Padel turnaj"
        />

        {/* Formáty */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "#801A28" }}>Co plánujeme</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {FORMATY.map((f) => (
                <div key={f.nadpis} className="rounded-2xl border border-zinc-100 p-6 hover:shadow-md transition-shadow">
                  <div className="mb-4" style={{ color: "#801A28" }}><f.Icon size={36} strokeWidth={1.5} /></div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "#0A0A0A" }}>{f.nadpis}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{f.popis}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Center kurt callout */}
        <section className="py-16 px-4" style={{ backgroundColor: "#801A28" }}>
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="flex justify-center mb-6"><Building2 size={64} strokeWidth={1.2} /></div>
            <h2 className="text-3xl font-extrabold mb-4 text-white">Center kurt v každé hale</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#f3c6ce" }}>
              Každý areál Grand Padel má center kurt s tribunami — zázemí pro turnaje a exhibice, které v Česku zatím jinde nenajdete.
            </p>
          </div>
        </section>

        {/* Proč padel */}
        <section className="py-16 px-4" style={{ backgroundColor: "#F2EDE4" }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#801A28" }}>Proč padel?</h2>
            <p className="text-lg leading-relaxed mb-4" style={{ color: "#6b7280" }}>
              Padel spojuje to nejlepší z tenisu a squashe — hraje se vždy ve čtyřech, na uzavřeném kurtu se skleněnými stěnami. Pravidla pochopíte za pět minut, první výměny si užijete hned.
            </p>
            <p className="text-lg leading-relaxed" style={{ color: "#6b7280" }}>
              Ale to hlavní není sport samotný. Je to <strong style={{ color: "#0A0A0A" }}>komunita</strong>. Najdete si parťáky, zahrajete si turnaje a eventy — a do těch se můžete přihlásit i jako jednotlivec, organizátoři vás dají do týmu.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center bg-white">
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#801A28" }}>Nechte nám e-mail</h2>
          <p className="mb-8 max-w-md mx-auto" style={{ color: "#6b7280" }}>Jakmile vypíšeme první turnaj, dáme vám vědět jako prvním.</p>
          <Link href="/kontakt" className="rounded-full px-8 py-4 text-base font-semibold text-white transition-colors" style={{ backgroundColor: "#801A28" }}>Kontaktovat nás</Link>
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
