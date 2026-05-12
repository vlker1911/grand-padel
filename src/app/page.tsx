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
    icon: "🎾",
    title: "6 kurtů",
    description: "Moderní kryté i venkovní kurty s umělou trávou nejvyšší kvality.",
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
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-zinc-900 transition-colors"
              >
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

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-zinc-50 py-24 px-4">
        <div className="max-w-3xl text-center">
          <span className="inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700 mb-6">
            Praha – Smíchov
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight mb-6">
            Padel na nejvyšší{" "}
            <span className="text-green-600">úrovni</span>
          </h1>
          <p className="text-xl text-zinc-500 leading-relaxed mb-10 max-w-xl mx-auto">
            Moderní padel centrum v srdci Prahy. Rezervujte kurt, přihlaste se
            na turnaj nebo začněte s akademií.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/rezervace"
              className="rounded-full bg-green-600 px-8 py-4 text-base font-semibold text-white hover:bg-green-700 transition-colors shadow-md"
            >
              Rezervovat kurt
            </Link>
            <Link
              href="/turnaje"
              className="rounded-full border border-zinc-300 px-8 py-4 text-base font-semibold text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
            >
              Zobrazit turnaje
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-zinc-900 mb-12">
            Vše na jednom místě
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-zinc-100 p-6 hover:shadow-md transition-shadow"
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
        <h2 className="text-3xl font-bold mb-4">Začněte hrát ještě dnes</h2>
        <p className="text-green-100 mb-8 max-w-md mx-auto">
          První hodina s trenérem zdarma pro nové členy. Registrujte se nyní.
        </p>
        <Link
          href="/akademie"
          className="rounded-full bg-white px-8 py-4 text-base font-semibold text-green-700 hover:bg-green-50 transition-colors"
        >
          Zjistit více
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-10 px-4 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="text-white font-bold text-base mb-1">
              <span className="text-green-400">Grand</span> Padel
            </p>
            <p>Nádražní 12, 150 00 Praha 5 – Smíchov</p>
            <p>info@grandpadel.cz · +420 777 123 456</p>
          </div>
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="text-xs text-zinc-600 self-end">
            © {new Date().getFullYear()} Grand Padel. Všechna práva vyhrazena.
          </div>
        </div>
      </footer>
    </div>
  );
}
