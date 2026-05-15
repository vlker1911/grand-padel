import Link from "next/link";
import Image from "next/image";
import Navbar, { NAV_LINKS } from "@/components/Navbar";

const FEATURES = [
  { icon: "🏟️", title: "Center kurt", description: "Každá hala má vlastní center kurt s tribunami – unikát, který jinde nenajdete." },
  { icon: "📅", title: "Online rezervace", description: "Zarezervujte kurt jednoduše online 24/7 – bez čekání a volání." },
  { icon: "🏆", title: "Turnaje & ligy", description: "Pravidelné turnaje pro všechny úrovně. Přidejte se k ligové soutěži." },
  { icon: "🎓", title: "Akademie", description: "Tréninky s certifikovanými trenéry pro začátečníky i pokročilé." },
];

const ARENAS = [
  { city: "Olomouc",      date: "září / říjen 2026",          courts: 7,  status: "brzy" },
  { city: "Ostrava",      date: "listopad / prosinec 2026",   courts: 8,  status: "brzy" },
  { city: "Praha Zličín", date: "březen 2027",                 courts: 10, status: "plánováno" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero — bordó s foto overlay */}
      <section className="relative flex items-center justify-center py-32 px-4 text-white overflow-hidden" style={{ backgroundColor: "#801A28", minHeight: "70vh" }}>
        <Image
          src="/photos/hero-homepage.jpg"
          alt="Grand Padel — indoor padel hala"
          fill
          className="object-cover opacity-25"
          priority
        />
        <div className="relative z-10 max-w-3xl text-center">
          <span className="inline-block rounded-full px-4 py-1 text-sm font-medium mb-6" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            Olomouc · Ostrava · Praha — od 2026
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Padel na nejvyšší úrovni
          </h1>
          <p className="text-xl leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.88)" }}>
            Budujeme síť moderních indoor padelových hal v České republice.
            Každá hala s center kurtem — to jinde nenajdete.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/o-nas" className="rounded-full px-8 py-4 text-base font-semibold transition-colors shadow-md bg-white" style={{ color: "#801A28" }}>
              Zjistit více
            </Link>
            <Link href="/kontakt" className="rounded-full border border-white/50 px-8 py-4 text-base font-semibold transition-colors hover:bg-white/10">
              Kontaktovat nás
            </Link>
          </div>
        </div>
      </section>

      {/* Areály */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4" style={{ color: "#801A28" }}>Naše areály</h2>
          <p className="text-center mb-12 max-w-xl mx-auto" style={{ color: "#6b7280" }}>
            Tři moderní indoor haly — každá s center kurtem, který v České republice nemá obdoby.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ARENAS.map((a) => (
              <div key={a.city} className="rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="relative h-44">
                  <Image src="/photos/arena.jpg" alt={`Grand Padel ${a.city}`} fill className="object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(128,26,40,0.7) 0%, transparent 60%)" }} />
                  <span className="absolute bottom-3 left-4 text-white font-bold text-lg">{a.city}</span>
                  <span className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: "rgba(128,26,40,0.85)" }}>{a.status}</span>
                </div>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex flex-col gap-1.5 text-sm" style={{ color: "#6b7280" }}>
                    <div className="flex items-center gap-2"><span>📅</span><span>{a.date}</span></div>
                    <div className="flex items-center gap-2"><span>🎾</span><span>{a.courts} kurtů vč. center kurtu</span></div>
                  </div>
                  <div className="mt-auto pt-3 border-t border-zinc-100 flex items-center gap-2 text-sm font-medium" style={{ color: "#801A28" }}>
                    <span>🏟️</span><span>Center kurt s tribunami</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: "#801A28" }}>Co Grand Padel nabízí</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-6 hover:shadow-md transition-shadow">
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
        <Link href="/kontakt" className="rounded-full px-8 py-4 text-base font-semibold transition-colors bg-white" style={{ color: "#801A28" }}>
          Mám zájem
        </Link>
      </section>

      {/* Instagram sekce */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-bold" style={{ color: "#801A28" }}>Sledujte nás</h2>
              <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>@grandpadelcz na Instagramu</p>
            </div>
            <a href="https://www.instagram.com/grandpadelcz" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Sledovat
            </a>
          </div>

          {/* Post karta */}
          <div className="max-w-sm">
            <a href="https://www.instagram.com/p/DYUCvb3iJNT/" target="_blank" rel="noopener noreferrer"
              className="block rounded-2xl overflow-hidden border border-zinc-100 hover:shadow-md transition-shadow">
              <div className="relative h-72">
                <Image src="/photos/hero-homepage.jpg" alt="Co nás čeká?" fill className="object-cover" />
                <div className="absolute inset-0 flex items-end p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}>
                  <span className="text-white font-bold text-2xl">Co nás čeká?</span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
                  Grand Padel startuje na podzim 2026 v Olomouci. Poté přidáme Ostravu a na jaře 2027 i Prahu.
                  Čeká tě moderní klubová atmosféra, komunita, turnaje i hry pro každého.
                </p>
                <p className="text-xs mt-3" style={{ color: "#9ca3af" }}>@grandpadelcz</p>
              </div>
            </a>
          </div>
        </div>
      </section>

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
          <div className="text-xs self-end" style={{ color: "#4b5563" }}>
            <div>© {new Date().getFullYear()} Grand Padel s.r.o. Všechna práva vyhrazena.</div>
            <div className="mt-1" style={{ color: "#374151" }}>v{process.env.NEXT_PUBLIC_APP_VERSION}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
