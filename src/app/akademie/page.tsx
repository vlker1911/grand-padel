import Link from "next/link";
import type { Metadata } from "next";
import Navbar, { NAV_LINKS } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Akademie – Grand Padel",
  description: "Padel akademie Grand Padel – tréninky pro začátečníky i pokročilé. Spouštíme v říjnu 2026.",
};

const UROVNE = [
  {
    icon: "🌱",
    nadpis: "Začátečníci",
    popis: "Nikdy jste nesáhli na padelovou raketu? Nevadí. Za 2–3 hodiny pochopíte pravidla a zahrajete si plnohodnotný zápas.",
    obsah: ["Základy drilu a pohybu", "Servis a return", "Pravidla hry", "První skupinový trénink"],
  },
  {
    icon: "📈",
    nadpis: "Středně pokročilí",
    popis: "Hrajete, ale chcete posunout techniku a taktiku. Zaměříme se na slabá místa a přidáme závodní prvky.",
    obsah: ["Technická analýza", "Taktika čtyřhry", "Smečování a obrana", "Tréninkové zápasy"],
  },
  {
    icon: "🏆",
    nadpis: "Pokročilí",
    popis: "Hrajete turnaje nebo o ně usilujete. Individuální přístup, videoanalýza, příprava na soutěže.",
    obsah: ["Individuální trénink", "Videoanalýza zápasů", "Turnajová příprava", "Kondiční trénink"],
  },
  {
    icon: "👶",
    nadpis: "Děti & mládež",
    popis: "Padel je ideální sport pro děti — rychle se naučí, bezpečné prostředí, skvělá parta.",
    obsah: ["Od 7 let", "Hrová forma tréninku", "Skupinky dle věku", "Příprava na mládežnické turnaje"],
  },
];

export default function Akademie() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 px-4 text-center" style={{ background: "linear-gradient(135deg, #F2EDE4 0%, #fff 60%, #F2EDE4 100%)" }}>
          <span className="inline-block rounded-full px-4 py-1 text-sm font-medium mb-6" style={{ backgroundColor: "#F2EDE4", color: "#801A28" }}>
            Spouštíme v říjnu 2026 — Olomouc
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4" style={{ color: "#0A0A0A" }}>
            Grand Padel Akademie
          </h1>
          <p className="text-xl max-w-2xl mx-auto mb-8" style={{ color: "#6b7280" }}>
            Tréninky s certifikovanými trenéry pro všechny úrovně — od prvního kurtu
            až po turnajovou přípravu. Přihlaste se k odběru novinek.
          </p>
          <Link
            href="/kontakt"
            className="rounded-full px-8 py-4 text-base font-semibold text-white transition-colors"
            style={{ backgroundColor: "#801A28" }}
          >
            Chci být informován
          </Link>
        </section>

        {/* Úrovně */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "#0A0A0A" }}>
              Tréninky pro každého
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {UROVNE.map((u) => (
                <div
                  key={u.nadpis}
                  className="rounded-2xl border border-zinc-100 p-6 hover:shadow-md transition-shadow flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{u.icon}</span>
                    <h3 className="text-lg font-semibold" style={{ color: "#0A0A0A" }}>{u.nadpis}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{u.popis}</p>
                  <ul className="flex flex-col gap-1 mt-auto">
                    {u.obsah.map((bod) => (
                      <li key={bod} className="flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
                        <span style={{ color: "#801A28" }}>→</span>
                        {bod}
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
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#0A0A0A" }}>Naši trenéři</h2>
            <p className="text-lg leading-relaxed mb-8" style={{ color: "#6b7280" }}>
              Tým trenérů Grand Padel Akademie připravujeme. Pracujeme s certifikovanými
              padelovými trenéry s mezinárodními zkušenostmi. Detaily zveřejníme před otevřením.
            </p>
            <div className="rounded-2xl p-8 border border-zinc-200 bg-white">
              <p className="text-sm font-medium mb-1" style={{ color: "#801A28" }}>Chcete trénovat u nás?</p>
              <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                Hledáme certifikované trenéry padelu pro Olomouc, Ostravu i Prahu. Ozvěte se.
              </p>
              <Link
                href="/kontakt"
                className="inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: "#801A28" }}
              >
                Kontaktovat nás
              </Link>
            </div>
          </div>
        </section>

        {/* Proč akademie */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 text-center">
            {[
              { num: "4", label: "úrovně tréninku", sub: "od úplných začátečníků po pokročilé" },
              { num: "7:00", label: "– 23:00", sub: "tréninky každý den" },
              { num: "3×", label: "haly do 2027", sub: "Olomouc, Ostrava, Praha Zličín" },
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
          <p className="mb-8 max-w-md mx-auto" style={{ color: "#f3c6ce" }}>
            Akademie startuje s otevřením haly v Olomouci — říjen 2026.
            Zanechte e-mail a dáme vám vědět jako prvním.
          </p>
          <Link
            href="/kontakt"
            className="rounded-full px-8 py-4 text-base font-semibold transition-colors"
            style={{ backgroundColor: "#fff", color: "#801A28" }}
          >
            Mám zájem
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
