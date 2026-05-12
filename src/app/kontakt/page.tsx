import Link from "next/link";
import type { Metadata } from "next";
import Navbar, { NAV_LINKS } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Kontakt – Grand Padel",
  description: "Kontaktujte Grand Padel – telefon, email, adresa.",
};

export default function Kontakt() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 px-4 text-center" style={{ background: "linear-gradient(135deg, #F2EDE4 0%, #fff 60%, #F2EDE4 100%)" }}>
          <span className="inline-block rounded-full px-4 py-1 text-sm font-medium mb-6" style={{ backgroundColor: "#F2EDE4", color: "#801A28" }}>
            Kontakt
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4" style={{ color: "#0A0A0A" }}>
            Ozvěte se nám
          </h1>
          <p className="text-xl max-w-xl mx-auto" style={{ color: "#6b7280" }}>
            Máte dotaz, zájem o spolupráci nebo chcete vědět víc? Napište nebo zavolejte.
          </p>
        </section>

        {/* Kontaktní info + formulář */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
            {/* Info */}
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-lg font-semibold mb-4" style={{ color: "#0A0A0A" }}>Kontaktní údaje</h2>
                <div className="flex flex-col gap-4 text-sm" style={{ color: "#6b7280" }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="font-medium" style={{ color: "#0A0A0A" }}>Adresa</p>
                      <p>Nad Sokolovnou 534</p>
                      <p>Hýskov</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📞</span>
                    <div>
                      <p className="font-medium" style={{ color: "#0A0A0A" }}>Telefon</p>
                      <a href="tel:+420722918191" className="transition-colors hover:text-[#801A28]">
                        722 918 191
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">✉️</span>
                    <div>
                      <p className="font-medium" style={{ color: "#0A0A0A" }}>Email</p>
                      <a href="mailto:info@grandpadel.cz" className="transition-colors hover:text-[#801A28]">
                        info@grandpadel.cz
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📸</span>
                    <div>
                      <p className="font-medium" style={{ color: "#0A0A0A" }}>Instagram</p>
                      <a
                        href="https://instagram.com/grand_padel_cz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-[#801A28]"
                      >
                        @grand_padel_cz
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6" style={{ backgroundColor: "#F2EDE4" }}>
                <p className="text-sm font-medium mb-1" style={{ color: "#801A28" }}>Otevření v roce 2026</p>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Naše první haly jsou v přípravné fázi. Sledujte nás na sociálních sítích
                  nebo nám zanechte email — dáme vám vědět jako prvním.
                </p>
              </div>
            </div>

            {/* Formulář */}
            <div>
              <h2 className="text-lg font-semibold mb-4" style={{ color: "#0A0A0A" }}>Napište nám</h2>
              <form className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" style={{ color: "#374151" }} htmlFor="jmeno">Jméno</label>
                    <input
                      id="jmeno"
                      type="text"
                      placeholder="Jana Nováková"
                      className="rounded-xl border border-zinc-200 px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ color: "#0A0A0A" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" style={{ color: "#374151" }} htmlFor="telefon">Telefon</label>
                    <input
                      id="telefon"
                      type="tel"
                      placeholder="+420 777 123 456"
                      className="rounded-xl border border-zinc-200 px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ color: "#0A0A0A" }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: "#374151" }} htmlFor="email">
                    Email <span style={{ color: "#801A28" }}>*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="jana@example.cz"
                    className="rounded-xl border border-zinc-200 px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ color: "#0A0A0A" }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: "#374151" }} htmlFor="predmet">Předmět</label>
                  <input
                    id="predmet"
                    type="text"
                    placeholder="Dotaz k otevření / spolupráce / ..."
                    className="rounded-xl border border-zinc-200 px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ color: "#0A0A0A" }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: "#374151" }} htmlFor="zprava">
                    Zpráva <span style={{ color: "#801A28" }}>*</span>
                  </label>
                  <textarea
                    id="zprava"
                    required
                    rows={5}
                    placeholder="Vaše zpráva..."
                    className="rounded-xl border border-zinc-200 px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                    style={{ color: "#0A0A0A" }}
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full px-8 py-4 text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: "#801A28" }}
                >
                  Odeslat zprávu
                </button>
                <p className="text-xs" style={{ color: "#9ca3af" }}>
                  Zpravidla odpovídáme do 24 hodin.
                </p>
              </form>
            </div>
          </div>
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
