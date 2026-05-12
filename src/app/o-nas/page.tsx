import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O nás – Grand Padel",
  description: "Grand Padel s.r.o. – budujeme síť moderních indoor padelových hal v České republice.",
};

const MILESTONES = [
  { year: "2024", text: "Založení Grand Padel s.r.o." },
  { year: "2025", text: "Přípravná fáze prvních dvou areálů" },
  { year: "2026", text: "Plánované otevření prvních hal" },
];

export default function ONash() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-green-600">Grand</span> Padel
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
            {[
              { href: "/rezervace", label: "Rezervace" },
              { href: "/turnaje", label: "Turnaje" },
              { href: "/akademie", label: "Akademie" },
              { href: "/o-nas", label: "O nás" },
              { href: "/kontakt", label: "Kontakt" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-zinc-900 transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/rezervace"
            className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Rezervovat kurt
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
            Grand Padel s.r.o. je nově vzniklá společnost s jasnou vizí — přinést
            jeden z nejrychleji rostoucích sportů světa do srdce České republiky.
          </p>
        </section>

        {/* Mise */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-4">Naše mise</h2>
              <p className="text-zinc-500 leading-relaxed mb-4">
                Chceme budovat síť moderních vnitřních padelových hal po celé České
                republice. Každý areál bude nabízet přibližně 8 profesionálních kurtů
                s kompletním zázemím — od šaten přes kavárnu až po tréninkové zázemí
                pro akademii.
              </p>
              <p className="text-zinc-500 leading-relaxed">
                Klademe důraz na kvalitu, komfort a přístupnost padelu pro všechny —
                od úplných začátečníků po závodní hráče.
              </p>
            </div>
            <div className="rounded-2xl bg-green-50 border border-green-100 p-8 text-center">
              <div className="text-5xl font-extrabold text-green-600 mb-2">2×</div>
              <div className="text-zinc-700 font-medium mb-1">areály v roce 2026</div>
              <div className="text-zinc-400 text-sm">každý s ~8 profesionálními kurty</div>
            </div>
          </div>
        </section>

        {/* Časová osa */}
        <section className="py-16 px-4 bg-zinc-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-zinc-900 mb-10 text-center">Naše cesta</h2>
            <div className="flex flex-col gap-6">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-16 shrink-0 text-right">
                    <span className="text-sm font-bold text-green-600">{m.year}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-600 mt-0.5 shrink-0 hidden md:block absolute ml-[-1.625rem]" />
                    <p className="text-zinc-700 font-medium">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Máte zájem o spolupráci?</h2>
          <p className="text-zinc-500 mb-8 max-w-md mx-auto">
            Rádi se dozvíme více o vašich plánech. Napište nám.
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
          <div className="text-xs text-zinc-600 self-end">
            © {new Date().getFullYear()} Grand Padel s.r.o. Všechna práva vyhrazena.
          </div>
        </div>
      </footer>
    </div>
  );
}
