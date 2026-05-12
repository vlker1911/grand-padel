import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt – Grand Padel",
  description: "Kontaktujte Grand Padel – telefon, email, adresa.",
};

const NAV_LINKS = [
  { href: "/rezervace", label: "Rezervace" },
  { href: "/turnaje", label: "Turnaje" },
  { href: "/akademie", label: "Akademie" },
  { href: "/o-nas", label: "O nás" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function Kontakt() {
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
            Kontakt
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-4">
            Ozvěte se nám
          </h1>
          <p className="text-xl text-zinc-500 max-w-xl mx-auto">
            Máte dotaz, zájem o spolupráci nebo chcete vědět víc? Napište nebo zavolejte.
          </p>
        </section>

        {/* Kontaktní info + formulář */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
            {/* Info */}
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Kontaktní údaje</h2>
                <div className="flex flex-col gap-4 text-sm text-zinc-600">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="font-medium text-zinc-900">Adresa</p>
                      <p>Nad Sokolovnou 534</p>
                      <p>Hýskov</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📞</span>
                    <div>
                      <p className="font-medium text-zinc-900">Telefon</p>
                      <a href="tel:+420722918191" className="hover:text-green-600 transition-colors">
                        722 918 191
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">✉️</span>
                    <div>
                      <p className="font-medium text-zinc-900">Email</p>
                      <a href="mailto:info@grandpadel.cz" className="hover:text-green-600 transition-colors">
                        info@grandpadel.cz
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📸</span>
                    <div>
                      <p className="font-medium text-zinc-900">Instagram</p>
                      <a
                        href="https://instagram.com/grand_padel_cz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-green-600 transition-colors"
                      >
                        @grand_padel_cz
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-green-50 border border-green-100 p-6">
                <p className="text-sm font-medium text-green-700 mb-1">Otevření v roce 2026</p>
                <p className="text-sm text-zinc-500">
                  Naše první haly jsou v přípravné fázi. Sledujte nás na sociálních sítích
                  nebo nám zanechte email — dáme vám vědět jako prvním.
                </p>
              </div>
            </div>

            {/* Formulář */}
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Napište nám</h2>
              <form className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-zinc-700" htmlFor="jmeno">
                      Jméno
                    </label>
                    <input
                      id="jmeno"
                      type="text"
                      placeholder="Jana Nováková"
                      className="rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-zinc-700" htmlFor="telefon">
                      Telefon
                    </label>
                    <input
                      id="telefon"
                      type="tel"
                      placeholder="+420 777 123 456"
                      className="rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700" htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="jana@example.cz"
                    className="rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700" htmlFor="predmet">
                    Předmět
                  </label>
                  <input
                    id="predmet"
                    type="text"
                    placeholder="Dotaz k otevření / spolupráce / ..."
                    className="rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700" htmlFor="zprava">
                    Zpráva <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="zprava"
                    required
                    rows={5}
                    placeholder="Vaše zpráva..."
                    className="rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-green-600 px-8 py-4 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                >
                  Odeslat zprávu
                </button>
                <p className="text-xs text-zinc-400">
                  Zpravidla odpovídáme do 24 hodin.
                </p>
              </form>
            </div>
          </div>
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
