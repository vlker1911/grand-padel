import Link from "next/link";

const NAV_LINKS = [
  { href: "/rezervace", label: "Rezervace" },
  { href: "/turnaje", label: "Turnaje" },
  { href: "/akademie", label: "Akademie" },
  { href: "/o-nas", label: "O nás" },
  { href: "/kontakt", label: "Kontakt" },
];

const FEATURES = [
  {
    icon: "🏟️",
    title: "Center kurt",
    description: "Každá hala má vlastní center kurt s tribunami – unikát, který jinde nenajdete.",
  },
  {
    icon: "📅",
    title: "Online rezervace",
    description: "Zarezervujte kurt jednoduše online 24/7 – bez čekání a volání.",
  },
  {
    icon: "🏆",
    title: "Turnaje & ligy",
    description: "Pravidelné turnaje pro všechny úrovně. Přidejte se k ligové soutěži.",
  },
  {
    icon: "🎓",
    title: "Akademie",
    description: "Tréninky s certifikovanými trenéry pro začátečníky i pokročilé.",
  },
];

const ARENAS = [
  {
    city: "Olomouc",
    date: "září / říjen 2026",
    courts: 7,
    status: "brzy",
  },
  {
    city: "Ostrava",
    date: "listopad / prosinec 2026",
    courts: 8,
    status: "brzy",
  },
  {
    city: "Praha Zličín",
    date: "březen 2027",
    courts: 10,
    status: "plánováno",
  },
];

export default function Home() {
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

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-zinc-50 py-24 px-4">
        <div className="max-w-3xl text-center">
          <span className="inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700 mb-6">
            Olomouc · Ostrava · Praha — od 2026
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight mb-6">
            Padel na nejvyšší{" "}
            <span className="text-green-600">úrovni</span>
          </h1>
          <p className="text-xl text-zinc-500 leading-relaxed mb-10 max-w-xl mx-auto">
            Budujeme síť moderních indoor padelových hal v České republice.
            Každá hala s center kurtem — to jinde nenajdete.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/o-nas"
              className="rounded-full bg-green-600 px-8 py-4 text-base font-semibold text-white hover:bg-green-700 transition-colors shadow-md"
            >
              Zjistit více
            </Link>
            <Link
              href="/kontakt"
              className="rounded-full border border-zinc-300 px-8 py-4 text-base font-semibold text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
            >
              Kontaktovat nás
            </Link>
          </div>
        </div>
      </section>

      {/* Areály */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-zinc-900 mb-4">
            Naše areály
          </h2>
          <p className="text-center text-zinc-500 mb-12 max-w-xl mx-auto">
            Tři moderní indoor haly — každá s center kurtem, který v České republice nemá obdoby.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ARENAS.map((a) => (
              <div
                key={a.city}
                className="rounded-2xl border border-zinc-100 p-8 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-zinc-900">{a.city}</h3>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    {a.status}
                  </span>
                </div>
                <div className="flex flex-col gap-2 text-sm text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{a.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🎾</span>
                    <span>{a.courts} kurtů vč. center kurtu</span>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center gap-2 text-sm font-medium text-green-600">
                  <span>🏟️</span>
                  <span>Center kurt s tribunami</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-zinc-900 mb-12">
            Co Grand Padel nabízí
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-zinc-100 bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-green-600 py-16 px-4 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Buďte u toho jako první</h2>
        <p className="text-green-100 mb-8 max-w-md mx-auto">
          Zanechte nám kontakt a dáme vám vědět, jakmile se otevře hala ve vašem městě.
        </p>
        <Link
          href="/kontakt"
          className="rounded-full bg-white px-8 py-4 text-base font-semibold text-green-700 hover:bg-green-50 transition-colors"
        >
          Mám zájem
        </Link>
      </section>

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
