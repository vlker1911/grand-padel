import Link from "next/link";
import Navbar, { NAV_LINKS } from "@/components/Navbar";

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
      <Navbar />

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center py-24 px-4" style={{ background: "linear-gradient(135deg, #F2EDE4 0%, #fff 60%, #F2EDE4 100%)" }}>
        <div className="max-w-3xl text-center">
          <span className="inline-block rounded-full px-4 py-1 text-sm font-medium mb-6" style={{ backgroundColor: "#F2EDE4", color: "#801A28" }}>
            Olomouc · Ostrava · Praha — od 2026
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-6" style={{ color: "#0A0A0A" }}>
            Padel na nejvyšší{" "}
            <span style={{ color: "#801A28" }}>úrovni</span>
          </h1>
          <p className="text-xl leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: "#6b7280" }}>
            Budujeme síť moderních indoor padelových hal v České republice.
            Každá hala s center kurtem — to jinde nenajdete.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/o-nas"
              className="rounded-full px-8 py-4 text-base font-semibold text-white transition-colors shadow-md"
              style={{ backgroundColor: "#801A28" }}
            >
              Zjistit více
            </Link>
            <Link
              href="/kontakt"
              className="rounded-full border px-8 py-4 text-base font-semibold transition-colors"
              style={{ borderColor: "#801A28", color: "#801A28" }}
            >
              Kontaktovat nás
            </Link>
          </div>
        </div>
      </section>

      {/* Areály */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4" style={{ color: "#0A0A0A" }}>
            Naše areály
          </h2>
          <p className="text-center mb-12 max-w-xl mx-auto" style={{ color: "#6b7280" }}>
            Tři moderní indoor haly — každá s center kurtem, který v České republice nemá obdoby.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ARENAS.map((a) => (
              <div
                key={a.city}
                className="rounded-2xl border border-zinc-100 p-8 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold" style={{ color: "#0A0A0A" }}>{a.city}</h3>
                  <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: "#F2EDE4", color: "#801A28" }}>
                    {a.status}
                  </span>
                </div>
                <div className="flex flex-col gap-2 text-sm" style={{ color: "#6b7280" }}>
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{a.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🎾</span>
                    <span>{a.courts} kurtů vč. center kurtu</span>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center gap-2 text-sm font-medium" style={{ color: "#801A28" }}>
                  <span>🏟️</span>
                  <span>Center kurt s tribunami</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: "#0A0A0A" }}>
            Co Grand Padel nabízí
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#0A0A0A" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-16 px-4 text-white text-center" style={{ backgroundColor: "#801A28" }}>
        <h2 className="text-3xl font-bold mb-4">Buďte u toho jako první</h2>
        <p className="mb-8 max-w-md mx-auto" style={{ color: "#f3c6ce" }}>
          Zanechte nám kontakt a dáme vám vědět, jakmile se otevře hala ve vašem městě.
        </p>
        <Link
          href="/kontakt"
          className="rounded-full px-8 py-4 text-base font-semibold transition-colors"
          style={{ backgroundColor: "#fff", color: "#801A28" }}
        >
          Mám zájem
        </Link>
      </section>

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
