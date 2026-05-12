import Link from "next/link";
import type { Metadata } from "next";
import Navbar, { NAV_LINKS } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Turnaje – Grand Padel",
  description: "Turnaje a ligy Grand Padel – přihlaste se k odběru novinek a buďte první na startu.",
};

const FORMATY = [
  {
    icon: "🏆",
    nadpis: "Grand Padel Open",
    popis: "Otevřené turnaje pro všechny úrovně. Přihlásit se můžete i jako jednotlivec — dáme vás do páru.",
  },
  {
    icon: "📅",
    nadpis: "Ligy",
    popis: "Pravidelná ligová soutěž. Hrajete každý týden se stejnými soupeři, sbíráte body, postoupíte nebo sestoupíte.",
  },
  {
    icon: "🎉",
    nadpis: "Firemní turnaje",
    popis: "Organizujeme turnaje na míru pro firmy a týmy. Ideální teambuilding — padel vtáhne každého.",
  },
  {
    icon: "⭐",
    nadpis: "Exhibice na center kurtu",
    popis: "Každá naše hala má center kurt s tribunami. Sledujte nejlepší hráče zblízka.",
  },
];

export default function Turnaje() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 px-4 text-center" style={{ background: "linear-gradient(135deg, #F2EDE4 0%, #fff 60%, #F2EDE4 100%)" }}>
          <span className="inline-block rounded-full px-4 py-1 text-sm font-medium mb-6" style={{ backgroundColor: "#F2EDE4", color: "#801A28" }}>
            Od října 2026 — Olomouc
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4" style={{ color: "#0A0A0A" }}>
            Turnaje & ligy
          </h1>
          <p className="text-xl max-w-2xl mx-auto mb-8" style={{ color: "#6b7280" }}>
            Padel je nejlepší ve čtyřech — ale komunita, která ho obklopuje, je to, co vás vtáhne.
            Přihlaste se k odběru a jako první se dozvíte, kdy zahajujeme.
          </p>
          <Link
            href="/kontakt"
            className="rounded-full px-8 py-4 text-base font-semibold text-white transition-colors"
            style={{ backgroundColor: "#801A28" }}
          >
            Chci být u startu
          </Link>
        </section>

        {/* Formáty */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "#0A0A0A" }}>
              Co plánujeme
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {FORMATY.map((f) => (
                <div
                  key={f.nadpis}
                  className="rounded-2xl border border-zinc-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-4">{f.icon}</div>
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
            <div className="text-5xl mb-6">🏟️</div>
            <h2 className="text-3xl font-extrabold mb-4">Center kurt v každé hale</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#f3c6ce" }}>
              Každý areál Grand Padel má center kurt s tribunami — zázemí pro turnaje
              a exhibice, které v Česku zatím nikde jinde nenajdete.
            </p>
          </div>
        </section>

        {/* Co je padel */}
        <section className="py-16 px-4" style={{ backgroundColor: "#F2EDE4" }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#0A0A0A" }}>
              Proč padel?
            </h2>
            <p className="text-lg leading-relaxed mb-4" style={{ color: "#6b7280" }}>
              Padel spojuje to nejlepší z tenisu a squashe — hraje se vždy ve čtyřech,
              na uzavřeném kurtu se skleněnými stěnami. Pravidla pochopíte za pět minut,
              první výměny si užijete hned.
            </p>
            <p className="text-lg leading-relaxed" style={{ color: "#6b7280" }}>
              Ale to hlavní není sport samotný. Je to <strong style={{ color: "#0A0A0A" }}>komunita</strong>.
              Najdete si parťáky, zahrajete si turnaje a eventy — a do těch se můžete přihlásit
              i jako jednotlivec, organizátoři vás dají do týmu.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center bg-white">
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#0A0A0A" }}>
            Nechte nám e-mail
          </h2>
          <p className="mb-8 max-w-md mx-auto" style={{ color: "#6b7280" }}>
            Jakmile vypíšeme první turnaj, dáme vám vědět jako prvním.
          </p>
          <Link
            href="/kontakt"
            className="rounded-full px-8 py-4 text-base font-semibold text-white transition-colors"
            style={{ backgroundColor: "#801A28" }}
          >
            Kontaktovat nás
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 px-4 text-sm" style={{ backgroundColor: "#0A0A0A", color: "#9ca3af" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="font-bold text-base mb-1 text-white">Grand Padel s.r.o.</p>
            <p>Nad Sokolovnou 534, Hýskov</p>
            <p>info@grandpadel.cz · 722 918 191</p>
          </div>
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="text-xs self-end" style={{ color: "#4b5563" }}>
            © {new Date().getFullYear()} Grand Padel s.r.o. Všechna práva vyhrazena.
          </div>
        </div>
      </footer>
    </div>
  );
}
