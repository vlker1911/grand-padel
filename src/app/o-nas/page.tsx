import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O nás – Grand Padel",
  description: "Grand Padel s.r.o. – budujeme síť moderních indoor padelových hal v České republice.",
};

const NAV_LINKS = [
  { href: "/rezervace", label: "Rezervace" },
  { href: "/turnaje", label: "Turnaje" },
  { href: "/akademie", label: "Akademie" },
  { href: "/o-nas", label: "O nás" },
  { href: "/kontakt", label: "Kontakt" },
];

const ARENAS = [
  {
    city: "Olomouc",
    date: "září / říjen 2026",
    courts: 7,
    detail: "První hala sítě Grand Padel. 7 kurtů s nejvyšším standardem povrchu a zázemím.",
  },
  {
    city: "Ostrava",
    date: "listopad / prosinec 2026",
    courts: 8,
    detail: "Druhá hala otevírá ještě před koncem roku 2026. 8 kurtů pro celou Moravskoslezskou aglomeraci.",
  },
  {
    city: "Praha Zličín",
    date: "březen 2027",
    courts: 10,
    detail: "Největší hala sítě. 10 kurtů v západní části Prahy s výbornou dopravní dostupností.",
  },
];

export default function ONas() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-green-600">Grand</span> Padel
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-zinc-900 transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/kontakt"
            className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Mám zájem
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-green-50 via-white to-zinc-50 py-20 px-4 text-center">
          <span className="inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700 mb-6">
            O nás
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-4">
            Budujeme padel v Česku
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
            Grand Padel s.r.o. staví síť moderních indoor padelových hal — s důrazem na kvalitu,
            komfort a jedinečný zážitek pro každého hráče.
          </p>
        </section>

        {/* Mise */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-4">Naše mise</h2>
              <p className="text-zinc-500 leading-relaxed mb-4">
                Chceme přinést jeden z nejrychleji rostoucích sportů světa do všech koutů
                České republiky. Každý areál Grand Padel nabídne profesionální kurty,
                kompletní zázemí a přátelskou atmosféru — ať přijdete poprvé nebo jako zkušený hráč.
              </p>
              <p className="text-zinc-500 leading-relaxed">
                Stavíme na kvalitě bez kompromisů. Proto každá naše hala obsahuje to,
                co ostatní centra v Česku nemají — <strong className="text-zinc-900">center kurt s tribunami</strong>.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { num: "3", label: "areály do 2027" },
                { num: "25", label: "kurtů celkem" },
                { num: "1×", label: "center kurt v každé hale" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-green-50 border border-green-100 p-4">
                  <div className="text-3xl font-extrabold text-green-600 mb-1">{s.num}</div>
                  <div className="text-xs text-zinc-500 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Center kurt – USP */}
        <section className="py-16 px-4 bg-zinc-900 text-white">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10 items-center">
            <div className="text-7xl shrink-0">🏟️</div>
            <div>
              <span className="inline-block rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white mb-3">
                Unikát v České republice
              </span>
              <h2 className="text-3xl font-extrabold mb-4">Center kurt</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">
                Každá hala Grand Padel má vlastní <strong className="text-white">center kurt s tribunami</strong> —
                plnohodnotné zázemí pro sledování zápasů, pořádání turnajů i exhibičních utkání.
                V tuzemských padelových centrech to zatím nikde nenajdete.
              </p>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Center kurt povyšuje zážitek diváků i hráčů na úroveň, která byla dosud
                dostupná jen na mezinárodních akcích. Grand Padel ji přiveze do Olomouce,
                Ostravy i Prahy.
              </p>
            </div>
          </div>
        </section>

        {/* Areály – časová osa */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-zinc-900 mb-10 text-center">Plán otevírání</h2>
            <div className="flex flex-col gap-6">
              {ARENAS.map((a, i) => (
                <div
                  key={a.city}
                  className="rounded-2xl border border-zinc-100 p-6 md:p-8 grid md:grid-cols-[140px_1fr_auto] gap-4 md:gap-8 items-start hover:shadow-md transition-shadow"
                >
                  <div>
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                      {i === 2 ? "2027" : "2026"}
                    </span>
                    <p className="text-sm text-zinc-500 mt-0.5">{a.date}</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-1">{a.city}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{a.detail}</p>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-zinc-500 shrink-0">
                    <div className="flex items-center gap-2">
                      <span>🎾</span>
                      <span>{a.courts} kurtů</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <span>🏟️</span>
                      <span>center kurt</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center bg-zinc-50">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Chcete být u otevření?</h2>
          <p className="text-zinc-500 mb-8 max-w-md mx-auto">
            Zanechte nám kontakt a dáme vám vědět jako prvním, kdy a kde otevíráme.
          </p>
          <Link
            href="/kontakt"
            className="rounded-full bg-green-600 px-8 py-4 text-base font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Kontaktovat nás
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-10 px-4 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="text-white font-bold text-base mb-1">
              <span className="text-green-400">Grand</span> Padel
            </p>
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
          <div className="text-xs text-zinc-600 self-end">
            © {new Date().getFullYear()} Grand Padel s.r.o. Všechna práva vyhrazena.
          </div>
        </div>
      </footer>
    </div>
  );
}
