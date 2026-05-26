"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, AtSign, CheckCircle2 } from "lucide-react";
import Navbar, { NAV_LINKS } from "@/components/Navbar";
import PageHero from "@/components/PageHero";

const LIDE = [
  { jmeno: "Josef Zderadička", role: "Jednatel společnosti", tel: "+420 607 834 796", email: "zderadicka@grandpadel.cz" },
  { jmeno: "Jiří Valenta",     role: null,                   tel: "+420 704 445 984", email: "valenta@grandpadel.cz" },
  { jmeno: "André Arencibia",  role: null,                   tel: "+420 773 543 765", email: "andre@padelspace.cz" },
  { jmeno: "Roman Vlk",        role: null,                   tel: "+420 722 918 191", email: "info@grandpadel.cz" },
];

export default function Kontakt() {
  const [stav, setStav] = useState<"idle" | "odesila" | "ok" | "chyba">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStav("odesila");

    const form = e.currentTarget;
    const data = {
      jmeno:   (form.elements.namedItem("jmeno")   as HTMLInputElement).value,
      telefon: (form.elements.namedItem("telefon") as HTMLInputElement).value,
      email:   (form.elements.namedItem("email")   as HTMLInputElement).value,
      predmet: (form.elements.namedItem("predmet") as HTMLInputElement).value,
      zprava:  (form.elements.namedItem("zprava")  as HTMLTextAreaElement).value,
    };

    const res = await fetch("/api/kontakt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setStav(res.ok ? "ok" : "chyba");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        <PageHero
          badge="Kontakt"
          title="Ozvěte se nám"
          subtitle="Máte dotaz, zájem o spolupráci nebo chcete vědět víc? Napište nebo zavolejte."
        />

        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">

            {/* LEVÝ SLOUPEC */}
            <div className="flex flex-col gap-10">

              {/* Kontaktní údaje firmy */}
              <div>
                <h2 className="text-xl font-bold mb-1 pb-3 border-b-2" style={{ color: "#8C1325", borderColor: "#8C1325" }}>
                  Kontakt
                </h2>
                <div className="mt-5 flex flex-col gap-3 text-sm" style={{ color: "#374151" }}>
                  <p className="text-base font-bold" style={{ color: "#0A0A0A" }}>Grand Padel s.r.o.</p>

                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: "#8C1325" }} />
                    <div>
                      <p>Nad Sokolovnou 534</p>
                      <p>267 06 Hýskov</p>
                      <p>Česká republika</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Phone size={16} className="shrink-0" style={{ color: "#8C1325" }} />
                    <a href="tel:+420722918191" className="hover:underline" style={{ color: "#374151" }}>+420 722 918 191</a>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Mail size={16} className="shrink-0" style={{ color: "#8C1325" }} />
                    <a href="mailto:info@grandpadel.cz" className="hover:underline" style={{ color: "#374151" }}>info@grandpadel.cz</a>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <AtSign size={16} className="shrink-0" style={{ color: "#8C1325" }} />
                    <a href="https://www.instagram.com/grandpadelcz" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#374151" }}>
                      @grandpadelcz
                    </a>
                  </div>
                </div>

                {/* Právní údaje */}
                <div className="mt-6 pt-5 border-t border-zinc-200 text-sm flex flex-col gap-1.5" style={{ color: "#374151" }}>
                  <div className="flex gap-2"><span className="font-bold w-10">IČO:</span><span>240 37 451</span></div>
                  <div className="flex gap-2"><span className="font-bold w-10">DIČ:</span><span>CZ24037451</span></div>
                </div>

                {/* Bankovní údaje */}
                <div className="mt-4 pt-4 border-t border-zinc-200 text-sm flex flex-col gap-1.5" style={{ color: "#374151" }}>
                  <div className="flex gap-2"><span className="font-bold min-w-[130px]">Bankovní spojení:</span><span>ČSOB a.s.</span></div>
                  <div className="flex gap-2"><span className="font-bold min-w-[130px]">Číslo účtu:</span><span>365299471/0300</span></div>
                </div>
              </div>

              {/* Lidé */}
              <div>
                <h2 className="text-xl font-bold mb-1 pb-3 border-b-2" style={{ color: "#8C1325", borderColor: "#8C1325" }}>
                  Obchodní a provozní kontakt
                </h2>
                <div className="mt-5 flex flex-col gap-5">
                  {LIDE.map((l) => (
                    <div key={l.jmeno} className="pl-4 border-l-2" style={{ borderColor: "#8C1325" }}>
                      <p className="font-bold text-sm" style={{ color: "#0A0A0A" }}>{l.jmeno}</p>
                      {l.role && <p className="text-xs mb-1" style={{ color: "#6b7280" }}>{l.role}</p>}
                      <a href={`tel:${l.tel.replace(/\s/g, "")}`} className="block text-sm hover:underline" style={{ color: "#8C1325" }}>{l.tel}</a>
                      <a href={`mailto:${l.email}`} className="block text-sm hover:underline" style={{ color: "#8C1325" }}>{l.email}</a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teaser box */}
              <div className="rounded-2xl p-6" style={{ backgroundColor: "#F2EDE4" }}>
                <p className="text-sm font-medium mb-1" style={{ color: "#8C1325" }}>Otevření v roce 2026</p>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Naše první haly jsou v přípravné fázi. Sledujte nás na sociálních sítích
                  nebo nám zanechte e-mail — dáme vám vědět jako prvním.
                </p>
              </div>
            </div>

            {/* PRAVÝ SLOUPEC — formulář */}
            <div>
              <h2 className="text-xl font-bold mb-1 pb-3 border-b-2" style={{ color: "#8C1325", borderColor: "#8C1325" }}>
                Napište nám
              </h2>

              {stav === "ok" ? (
                <div className="mt-5 rounded-2xl p-8 text-center" style={{ backgroundColor: "#F2EDE4" }}>
                  <div className="flex justify-center mb-3" style={{ color: "#16a34a" }}><CheckCircle2 size={40} strokeWidth={1.8} /></div>
                  <p className="font-semibold mb-1" style={{ color: "#0A0A0A" }}>Zpráva odeslána</p>
                  <p className="text-sm" style={{ color: "#6b7280" }}>Ozveme se vám zpravidla do 24 hodin.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium" style={{ color: "#374151" }} htmlFor="jmeno">Jméno</label>
                      <input id="jmeno" name="jmeno" type="text" placeholder="Jana Nováková"
                        className="rounded-xl border border-zinc-200 px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8C1325] focus:border-transparent"
                        style={{ color: "#0A0A0A" }} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium" style={{ color: "#374151" }} htmlFor="telefon">Telefon</label>
                      <input id="telefon" name="telefon" type="tel" placeholder="+420 777 123 456"
                        className="rounded-xl border border-zinc-200 px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8C1325] focus:border-transparent"
                        style={{ color: "#0A0A0A" }} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" style={{ color: "#374151" }} htmlFor="email">
                      Email <span style={{ color: "#8C1325" }}>*</span>
                    </label>
                    <input id="email" name="email" type="email" required placeholder="jana@example.cz"
                      className="rounded-xl border border-zinc-200 px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8C1325] focus:border-transparent"
                      style={{ color: "#0A0A0A" }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" style={{ color: "#374151" }} htmlFor="predmet">Předmět</label>
                    <input id="predmet" name="predmet" type="text" placeholder="Dotaz k otevření / spolupráce / ..."
                      className="rounded-xl border border-zinc-200 px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8C1325] focus:border-transparent"
                      style={{ color: "#0A0A0A" }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" style={{ color: "#374151" }} htmlFor="zprava">
                      Zpráva <span style={{ color: "#8C1325" }}>*</span>
                    </label>
                    <textarea id="zprava" name="zprava" required rows={5} placeholder="Vaše zpráva..."
                      className="rounded-xl border border-zinc-200 px-4 py-3 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8C1325] focus:border-transparent resize-none"
                      style={{ color: "#0A0A0A" }} />
                  </div>

                  {stav === "chyba" && (
                    <p className="text-sm" style={{ color: "#8C1325" }}>Něco se pokazilo. Zkuste to znovu nebo nás kontaktujte přímo na info@grandpadel.cz.</p>
                  )}

                  <button type="submit" disabled={stav === "odesila"}
                    className="rounded-full px-8 py-4 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: "#8C1325" }}>
                    {stav === "odesila" ? "Odesílám…" : "Odeslat zprávu"}
                  </button>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>Zpravidla odpovídáme do 24 hodin.</p>
                </form>
              )}
            </div>
          </div>
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
          <div className="text-xs self-end" style={{ color: "#4b5563" }}>
            © {new Date().getFullYear()} Grand Padel s.r.o. Všechna práva vyhrazena.
          </div>
        </div>
      </footer>
    </div>
  );
}
