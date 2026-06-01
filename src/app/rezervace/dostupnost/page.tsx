"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar, { NAV_LINKS } from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/client";
import {
  vypocitejVolneSloty,
  formatMinuty,
  dnesPraha,
  pridejDny,
  pulnocPrahaToUTC,
  minutyOdPulnociPraha,
  type Castdne,
  type KurtVypocet,
  type RezervaceVypocet,
  type VolneSlotyKurt,
} from "@/lib/dostupnost";

type DelkaOption = { value: number; label: string };

const DELKY_KRATKE: DelkaOption[] = [
  { value: 60,  label: "60 min" },
  { value: 90,  label: "90 min" },
  { value: 120, label: "120 min" },
];
const DELKY_DLOUHE: DelkaOption[] = [
  { value: 180, label: "3 hodiny" },
  { value: 240, label: "4 hodiny" },
  { value: 300, label: "5 hodin" },
  { value: 360, label: "6 hodin" },
];
const VSECHNY_DELKY: DelkaOption[] = [...DELKY_KRATKE, ...DELKY_DLOUHE];

const CASTI_DNE: { value: Castdne; label: string }[] = [
  { value: "kdykoliv",  label: "Kdykoliv (7:00–23:00)" },
  { value: "rano",      label: "Ráno (7:00–11:00)" },
  { value: "poledne",   label: "Poledne (11:00–14:00)" },
  { value: "odpoledne", label: "Odpoledne (14:00–18:00)" },
  { value: "vecer",     label: "Večer (18:00–23:00)" },
];

const BRAND = "#8C1325";

export default function DostupnostPage() {
  const dnes = dnesPraha();
  const maxDatum = pridejDny(dnes, 14);

  const [datum, setDatum] = useState<string>(dnes);
  const [delka, setDelka] = useState<number>(60);
  const [castDne, setCastDne] = useState<Castdne>("kdykoliv");

  const [kurty, setKurty] = useState<KurtVypocet[] | null>(null);
  const [rezervace, setRezervace] = useState<RezervaceVypocet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [chyba, setChyba] = useState<string | null>(null);
  const [hledano, setHledano] = useState<boolean>(false);

  // Spočítej minuty „teď" relativně k půlnoci vybraného dne v Praze (na klientu).
  const nowMin = useMemo(() => {
    return minutyOdPulnociPraha(new Date(), datum);
  }, [datum]);

  async function hledat(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setChyba(null);
    setHledano(true);
    try {
      const supabase = createClient();

      // 1) Najdi pobočky v Olomouci (pobočku nehardcodujeme přes UUID).
      const { data: pobocky, error: ep } = await supabase
        .from("pobocky")
        .select("id")
        .eq("mesto", "Olomouc");
      if (ep) throw ep;
      const pobockyIds = (pobocky ?? []).map((p) => p.id);
      if (pobockyIds.length === 0) {
        setKurty([]);
        setRezervace([]);
        return;
      }

      // 2) Aktivní kurty na těchto pobočkách.
      const { data: kurtyDb, error: ek } = await supabase
        .from("kurty")
        .select("id, nazev, cislo, je_center, je_aktivni")
        .in("pobocka_id", pobockyIds)
        .eq("je_aktivni", true)
        .order("cislo", { ascending: true });
      if (ek) throw ek;

      const kurtyList: KurtVypocet[] = (kurtyDb ?? []).map((k) => ({
        id: k.id,
        nazev: k.nazev,
        cislo: k.cislo,
        jeCenter: !!k.je_center,
      }));
      setKurty(kurtyList);

      // 3) Potvrzené rezervace na daný den (přesah řešíme oříznutím v JS).
      const denOd = new Date(pulnocPrahaToUTC(datum));
      const denDo = new Date(pulnocPrahaToUTC(datum) + 86_400_000);
      const kurtyIds = kurtyList.map((k) => k.id);
      if (kurtyIds.length === 0) {
        setRezervace([]);
        return;
      }
      const { data: rezDb, error: er } = await supabase
        .from("rezervace")
        .select("kurt_id, zacatek, konec, stav")
        .in("kurt_id", kurtyIds)
        .eq("stav", "potvrzena")
        .lt("zacatek", denDo.toISOString())
        .gt("konec", denOd.toISOString());
      if (er) throw er;

      const pulnocMs = pulnocPrahaToUTC(datum);
      const rezList: RezervaceVypocet[] = (rezDb ?? []).map((r) => ({
        kurtId: r.kurt_id,
        zacatekMin: Math.max(0, Math.round((new Date(r.zacatek).getTime() - pulnocMs) / 60000)),
        konecMin: Math.min(24 * 60, Math.round((new Date(r.konec).getTime() - pulnocMs) / 60000)),
      }));
      setRezervace(rezList);
    } catch (err) {
      console.error(err);
      setChyba(err instanceof Error ? err.message : "Nepodařilo se načíst data.");
    } finally {
      setLoading(false);
    }
  }

  // Načti automaticky při prvním otevření. Vlastní fetch (ne přes `hledat()`),
  // aby se v efektu nevolal setState synchronně před asynchronní prací.
  useEffect(() => {
    let zruseno = false;
    (async () => {
      const supabase = createClient();
      try {
        const { data: pobocky } = await supabase
          .from("pobocky")
          .select("id")
          .eq("mesto", "Olomouc");
        if (zruseno) return;
        const pobockyIds = (pobocky ?? []).map((p) => p.id);
        if (pobockyIds.length === 0) {
          setKurty([]);
          setHledano(true);
          return;
        }
        const { data: kurtyDb } = await supabase
          .from("kurty")
          .select("id, nazev, cislo, je_center, je_aktivni")
          .in("pobocka_id", pobockyIds)
          .eq("je_aktivni", true)
          .order("cislo", { ascending: true });
        if (zruseno) return;
        const kurtyList: KurtVypocet[] = (kurtyDb ?? []).map((k) => ({
          id: k.id, nazev: k.nazev, cislo: k.cislo, jeCenter: !!k.je_center,
        }));
        setKurty(kurtyList);
        setHledano(true);
        if (kurtyList.length === 0) return;
        const denOd = new Date(pulnocPrahaToUTC(datum));
        const denDo = new Date(pulnocPrahaToUTC(datum) + 86_400_000);
        const { data: rezDb } = await supabase
          .from("rezervace")
          .select("kurt_id, zacatek, konec, stav")
          .in("kurt_id", kurtyList.map((k) => k.id))
          .eq("stav", "potvrzena")
          .lt("zacatek", denDo.toISOString())
          .gt("konec", denOd.toISOString());
        if (zruseno) return;
        const pulnocMs = pulnocPrahaToUTC(datum);
        setRezervace((rezDb ?? []).map((r) => ({
          kurtId: r.kurt_id,
          zacatekMin: Math.max(0, Math.round((new Date(r.zacatek).getTime() - pulnocMs) / 60000)),
          konecMin: Math.min(24 * 60, Math.round((new Date(r.konec).getTime() - pulnocMs) / 60000)),
        })));
      } catch (err) {
        if (!zruseno) setChyba(err instanceof Error ? err.message : "Nepodařilo se načíst data.");
      }
    })();
    return () => { zruseno = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vysledek: VolneSlotyKurt[] = useMemo(() => {
    if (!kurty) return [];
    return vypocitejVolneSloty({
      kurty,
      rezervace,
      delkaMinut: delka,
      castDne,
      nowMin,
    });
  }, [kurty, rezervace, delka, castDne, nowMin]);

  const zadneVolnoCelkem = hledano && !loading && (vysledek.length === 0 || vysledek.every((v) => v.zacatky.length === 0));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <PageHero
          badge="Náhled dostupnosti"
          title="Volné kurty Olomouc"
          subtitle="Vyberte datum, délku hry a část dne. Systém vám ukáže, které kurty jsou v daný čas volné. Rezervaci spustíme spolu s otevřením haly."
        />

        <section className="py-10 px-4 bg-white border-b border-zinc-100">
          <form
            onSubmit={hledat}
            className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium" style={{ color: "#0A0A0A" }}>Datum</span>
              <input
                type="date"
                value={datum}
                min={dnes}
                max={maxDatum}
                onChange={(e) => setDatum(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-base focus:outline-none focus:ring-2"
                style={{ outlineColor: BRAND }}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium" style={{ color: "#0A0A0A" }}>Délka hry</span>
              <select
                value={delka}
                onChange={(e) => setDelka(Number(e.target.value))}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-base bg-white"
              >
                <optgroup label="Krátké">
                  {DELKY_KRATKE.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Dlouhé">
                  {DELKY_DLOUHE.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </optgroup>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium" style={{ color: "#0A0A0A" }}>Část dne</span>
              <select
                value={castDne}
                onChange={(e) => setCastDne(e.target.value as Castdne)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-base bg-white"
              >
                {CASTI_DNE.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg px-6 py-3 text-base font-semibold text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: BRAND }}
            >
              {loading ? "Načítám…" : "Zobrazit dostupnost"}
            </button>
          </form>
          {VSECHNY_DELKY.find((d) => d.value === delka) === undefined && (
            <p className="text-xs text-center mt-3" style={{ color: "#9ca3af" }}>
              Vyberte délku ze seznamu.
            </p>
          )}
        </section>

        <section className="py-12 px-4" style={{ backgroundColor: "#F2EDE4" }}>
          <div className="max-w-5xl mx-auto">
            {chyba && (
              <div
                className="rounded-lg p-4 mb-6 text-sm"
                style={{ backgroundColor: "#fee2e2", color: "#7f1d1d" }}
              >
                Chyba načítání: {chyba}
              </div>
            )}

            {!loading && kurty && kurty.length === 0 && (
              <div className="rounded-2xl bg-white border border-zinc-200 p-8 text-center">
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Aktuálně nejsou v Olomouci žádné aktivní kurty. Spouštíme s otevřením haly.
                </p>
              </div>
            )}

            {zadneVolnoCelkem && kurty && kurty.length > 0 && (
              <div className="rounded-2xl bg-white border border-zinc-200 p-8 text-center">
                <p className="text-base font-semibold mb-2" style={{ color: "#0A0A0A" }}>
                  Žádné volné časy
                </p>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Zkuste jinou délku nebo část dne.
                </p>
              </div>
            )}

            {!loading && kurty && kurty.length > 0 && !zadneVolnoCelkem && (
              <div className="space-y-3">
                {vysledek.map((v) => (
                  <div
                    key={v.kurt.id}
                    className="rounded-2xl bg-white border border-zinc-200 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-base" style={{ color: "#0A0A0A" }}>
                        {v.kurt.nazev}
                        {v.kurt.jeCenter && (
                          <span
                            className="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: BRAND, color: "#fff" }}
                          >
                            Center
                          </span>
                        )}
                      </h3>
                      <span className="text-xs" style={{ color: "#9ca3af" }}>
                        {v.zacatky.length === 0
                          ? "žádný volný čas"
                          : `${v.zacatky.length} volných začátků`}
                      </span>
                    </div>
                    {v.zacatky.length === 0 ? (
                      <p className="text-sm" style={{ color: "#9ca3af" }}>
                        Tento kurt je v daný čas plně obsazen.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {v.zacatky.map((min) => (
                          <span
                            key={min}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium border"
                            style={{
                              borderColor: BRAND,
                              color: BRAND,
                              backgroundColor: "rgba(140,19,37,0.05)",
                            }}
                          >
                            {formatMinuty(min)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-center mt-6" style={{ color: "#9ca3af" }}>
              Náhled dostupnosti — zatím jen pro informaci. Rezervovat půjde s otevřením haly.
            </p>
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
