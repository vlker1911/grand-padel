import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Navbar, { NAV_LINKS } from "@/components/Navbar";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "O nás – Grand Padel",
  description: "Grand Padel s.r.o. – budujeme síť moderních indoor padelových hal v České republice.",
};

const ARENAS = [
  { city: "Olomouc",      date: "září / říjen 2026",          courts: 7,  detail: "První hala sítě Grand Padel. 7 kurtů s nejvyšším standardem povrchu a zázemím." },
  { city: "Ostrava",      date: "listopad / prosinec 2026",   courts: 8,  detail: "Druhá hala otevírá ještě před koncem roku 2026. 8 kurtů pro celou Moravskoslezskou aglomeraci." },
  { city: "Praha Zličín", date: "březen 2027",                 courts: 10, detail: "Největší hala sítě. 10 kurtů v západní části Prahy s výbornou dopravní dostupností." },
];

export default function ONas() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">

        <PageHero
          badge="O nás"
          title="Budujeme padel v Česku"
          subtitle="Grand Padel s.r.o. staví síť moderních indoor padelových hal — s důrazem na kvalitu, komfort a jedinečný zážitek pro každého hráče."
          photo="/photos/about.jpg"
          photoAlt="Grand Padel padel hala"
        />

        {/* Mise */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#801A28" }}>Naše mise</h2>
              <p className="leading-relaxed mb-4" style={{ color: "#6b7280" }}>
                Chceme přinést jeden z nejrychleji rostoucích sportů světa do všech koutů České republiky.
                Každý areál Grand Padel nabídne profesionální kurty, kompletní zázemí a přátelskou atmosféru —
                ať přijdete poprvé nebo jako zkušený hráč.
              </p>
              <p className="leading-relaxed" style={{ color: "#6b7280" }}>
                Stavíme na kvalitě bez kompromisů. Proto každá naše hala obsahuje to,
                co ostatní centra v Česku nemají —{" "}
                <strong style={{ color: "#0A0A0A" }}>center kurt s tribunami</strong>.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { num: "3", label: "areály do 2027" },
                { num: "25", label: "kurtů celkem" },
                { num: "1×", label: "center kurt v každé hale" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-4" style={{ backgroundColor: "#F2EDE4" }}>
                  <div className="text-3xl font-extrabold mb-1" style={{ color: "#801A28" }}>{s.num}</div>
                  <div className="text-xs leading-snug" style={{ color: "#6b7280" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Center kurt USP */}
        <section className="py-16 px-4 text-white" style={{ backgroundColor: "#801A28" }}>
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10 items-center">
            <div className="text-7xl shrink-0">🏟️</div>
            <div>
              <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white mb-3" style={{ backgroundColor: "#5C121C" }}>
                Unikát v České republice
              </span>
              <h2 className="text-3xl font-extrabold mb-4 text-white">Center kurt</h2>
              <p className="leading-relaxed mb-3" style={{ color: "#f3c6ce" }}>
                Každá hala Grand Padel má vlastní <strong className="text-white">center kurt s tribunami</strong> —
                plnohodnotné zázemí pro sledování zápasů, pořádání turnajů i exhibičních utkání.
                V tuzemských padelových centrech to zatím nikde nenajdete.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#e8a0aa" }}>
                Center kurt povyšuje zážitek diváků i hráčů na úroveň, která byla dosud dostupná
                jen na mezinárodních akcích. Grand Padel ji přiveze do Olomouce, Ostravy i Prahy.
              </p>
            </div>
          </div>
        </section>

        {/* Plán otevírání */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-10 text-center" style={{ color: "#801A28" }}>Plán otevírání</h2>
            <div className="flex flex-col gap-6">
              {ARENAS.map((a, i) => (
                <div key={a.city} className="rounded-2xl border border-zinc-100 overflow-hidden grid md:grid-cols-[200px_1fr_auto] hover:shadow-md transition-shadow">
                  <div className="relative h-36 md:h-auto">
                    <Image src="/photos/arena.jpg" alt={`Grand Padel ${a.city}`} fill className="object-cover" />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#801A28" }}>{i === 2 ? "2027" : "2026"} — {a.date}</span>
                    <h3 className="text-xl font-bold mt-1 mb-2" style={{ color: "#0A0A0A" }}>{a.city}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{a.detail}</p>
                  </div>
                  <div className="p-6 flex flex-col gap-2 text-sm justify-center shrink-0" style={{ color: "#6b7280" }}>
                    <div className="flex items-center gap-2"><span>🎾</span><span>{a.courts} kurtů</span></div>
                    <div className="flex items-center gap-2 font-medium" style={{ color: "#801A28" }}><span>🏟️</span><span>center kurt</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center" style={{ backgroundColor: "#F2EDE4" }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#801A28" }}>Chcete být u otevření?</h2>
          <p className="mb-8 max-w-md mx-auto" style={{ color: "#6b7280" }}>
            Zanechte nám kontakt a dáme vám vědět jako prvním, kdy a kde otevíráme.
          </p>
          <Link href="/kontakt" className="rounded-full px-8 py-4 text-base font-semibold text-white transition-colors" style={{ backgroundColor: "#801A28" }}>
            Kontaktovat nás
          </Link>
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
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
            ))}
          </div>
          <div className="text-xs self-end" style={{ color: "#4b5563" }}>© {new Date().getFullYear()} Grand Padel s.r.o. Všechna práva vyhrazena.</div>
        </div>
      </footer>
    </div>
  );
}
