"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { spocitejTabulku } from "@/lib/americano";

type Hra = {
  id: string;
  nazev: string;
  typ: string;
  stav: string;
  pocet_kurtu: number;
  body_na_zapas: number;
  created_by: string;
  settings: {
    cas_od?: string;
    cas_do?: string;
    minut_na_kolo?: number;
    cisla_kurtu?: number[];
  } | null;
};

type Ucastnik = { id: string; jmeno: string; user_id: string | null };

type Zapas = {
  id: string;
  kolo: number;
  kurt: number;
  tym1_hrac1_id: string;
  tym1_hrac2_id: string;
  tym2_hrac1_id: string;
  tym2_hrac2_id: string;
  skore_tym1: number | null;
  skore_tym2: number | null;
  stav: string;
  faze: string;
};

// ---------- AMERICANO ----------

function AmericanoView({ hra, ucastnici, zapasy, jeEditor, nactiData }: {
  hra: Hra;
  ucastnici: Ucastnik[];
  zapasy: Zapas[];
  jeEditor: boolean;
  nactiData: () => void;
}) {
  const supabase = createClient();
  const [aktivniKolo, setAktivniKolo] = useState(1);
  const [editZapas, setEditZapas] = useState<string | null>(null);
  const [skore, setSkore] = useState({ s1: "", s2: "" });
  const [ukladam, setUkladam] = useState(false);
  const [zobrazFinal, setZobrazFinal] = useState(false);

  const limit = hra.body_na_zapas;
  const kola = [...new Set(zapasy.map(z => z.kolo))].sort((a, b) => a - b);
  const zapasyKola = zapasy.filter(z => z.kolo === aktivniKolo);
  const vsechnyOdehrany = zapasy.length > 0 && zapasy.every(z => z.skore_tym1 != null);

  const tabulka = spocitejTabulku(
    ucastnici.map(u => ({ id: u.id, jmeno: u.jmeno })),
    zapasy.map(z => ({
      tym1: [z.tym1_hrac1_id, z.tym1_hrac2_id] as [string, string],
      tym2: [z.tym2_hrac1_id, z.tym2_hrac2_id] as [string, string],
      skore_tym1: z.skore_tym1,
      skore_tym2: z.skore_tym2,
    }))
  );

  function jmeno(id: string) { return ucastnici.find(u => u.id === id)?.jmeno ?? "?"; }

  function handleS1Change(val: string) {
    const n = parseInt(val);
    if (!isNaN(n) && n >= 0 && n <= limit) {
      setSkore({ s1: val, s2: String(limit - n) });
    } else {
      setSkore({ s1: val, s2: skore.s2 });
    }
  }

  function handleS2Change(val: string) {
    const n = parseInt(val);
    if (!isNaN(n) && n >= 0 && n <= limit) {
      setSkore({ s1: String(limit - n), s2: val });
    } else {
      setSkore({ s1: skore.s1, s2: val });
    }
  }

  async function ulozSkore() {
    if (!editZapas) return;
    setUkladam(true);
    const s1 = parseInt(skore.s1), s2 = parseInt(skore.s2);
    if (!isNaN(s1) && !isNaN(s2)) {
      await supabase.from("hra_zapasy").update({ skore_tym1: s1, skore_tym2: s2, stav: "ukonceno" }).eq("id", editZapas);
      nactiData();
    }
    setEditZapas(null);
    setUkladam(false);
  }

  // Finalni obrazovka
  if (zobrazFinal || (vsechnyOdehrany && hra.stav === "ukonceno")) {
    return (
      <div className="flex flex-col gap-4">
        <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="px-5 py-6 border-b border-zinc-100 text-center">
            <h2 className="text-xl font-bold" style={{ color: "#801A28" }}>Vysledky — konecne poradi</h2>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>{hra.nazev}</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {tabulka.map((h, i) => (
              <div key={h.id} className="px-5 py-4 flex items-center gap-4">
                <span className="text-2xl font-black w-8 text-center" style={{
                  color: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : i === 2 ? "#cd7c32" : "#d1d5db"
                }}>
                  {i + 1}.
                </span>
                <span className="flex-1 font-semibold text-base" style={{ color: "#0A0A0A" }}>{h.jmeno}</span>
                <span className="font-bold text-lg" style={{ color: i === 0 ? "#801A28" : "#374151" }}>{h.body} b</span>
              </div>
            ))}
          </div>
        </section>
        <button onClick={() => setZobrazFinal(false)}
          className="w-full rounded-full py-3 text-sm font-semibold border border-zinc-200 bg-white"
          style={{ color: "#374151" }}>
          Zpet na zapasy
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Banner — vsechny zapasy odehrany */}
      {vsechnyOdehrany && (
        <div className="rounded-2xl p-4 flex items-center justify-between gap-4"
          style={{ backgroundColor: "#801A28" }}>
          <p className="text-sm font-semibold text-white">Vsechny zapasy jsou odehrany!</p>
          <button onClick={() => setZobrazFinal(true)}
            className="rounded-full px-5 py-2 text-sm font-semibold bg-white shrink-0"
            style={{ color: "#801A28" }}>
            Zobrazit vysledky
          </button>
        </div>
      )}

      {/* Tabulka */}
      <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>Prubezna tabulka</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#fafafa" }}>
              <th className="text-left px-5 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>#</th>
              <th className="text-left px-5 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>Hrac</th>
              <th className="text-right px-5 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>Body</th>
            </tr>
          </thead>
          <tbody>
            {tabulka.map((h, i) => (
              <tr key={h.id} className="border-t border-zinc-50">
                <td className="px-5 py-3 font-bold text-sm w-8" style={{ color: i === 0 ? "#801A28" : "#9ca3af" }}>{i + 1}</td>
                <td className="px-5 py-3 font-medium" style={{ color: "#0A0A0A" }}>{h.jmeno}</td>
                <td className="px-5 py-3 text-right font-bold" style={{ color: i === 0 ? "#801A28" : "#374151" }}>{h.body}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Zapasy */}
      <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>Zapasy</h2>
          <div className="flex gap-1 flex-wrap">
            {kola.map(k => (
              <button key={k} onClick={() => setAktivniKolo(k)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ backgroundColor: aktivniKolo === k ? "#801A28" : "transparent", color: aktivniKolo === k ? "white" : "#6b7280" }}>
                Kolo {k}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-zinc-50">
          {zapasyKola.map(z => (
            <div key={z.id} className="px-5 py-4">
              <div className="flex items-center gap-4">
                <p className="text-xs font-medium shrink-0 w-14" style={{ color: "#9ca3af" }}>Kurt {z.kurt}</p>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 text-right">
                    <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>{jmeno(z.tym1_hrac1_id)}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{jmeno(z.tym1_hrac2_id)}</p>
                  </div>
                  <div className="shrink-0 text-center w-16">
                    {z.skore_tym1 != null
                      ? <span className="text-base font-bold" style={{ color: "#0A0A0A" }}>{z.skore_tym1} : {z.skore_tym2}</span>
                      : <span className="text-sm" style={{ color: "#9ca3af" }}>vs</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>{jmeno(z.tym2_hrac1_id)}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{jmeno(z.tym2_hrac2_id)}</p>
                  </div>
                </div>
                {jeEditor && (
                  <button onClick={() => { setEditZapas(z.id); setSkore({ s1: z.skore_tym1?.toString() ?? "", s2: z.skore_tym2?.toString() ?? "" }); }}
                    className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
                    style={{ color: "#801A28" }}>
                    {z.skore_tym1 != null ? "Upravit" : "Zadat"}
                  </button>
                )}
              </div>
              {editZapas === z.id && (
                <div className="mt-3 flex items-center gap-2 justify-end flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs" style={{ color: "#9ca3af" }}>{jmeno(z.tym1_hrac1_id).split(" ")[0]}</span>
                      <input type="number" min={0} max={limit} value={skore.s1}
                        onChange={e => handleS1Change(e.target.value)}
                        className="w-14 rounded-lg border-2 border-[#801A28] px-2 py-2 text-center text-sm font-bold focus:outline-none" />
                    </div>
                    <span className="font-bold text-sm mt-4" style={{ color: "#9ca3af" }}>:</span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs" style={{ color: "#9ca3af" }}>{jmeno(z.tym2_hrac1_id).split(" ")[0]}</span>
                      <input type="number" min={0} max={limit} value={skore.s2}
                        onChange={e => handleS2Change(e.target.value)}
                        className="w-14 rounded-lg border-2 border-[#801A28] px-2 py-2 text-center text-sm font-bold focus:outline-none" />
                    </div>
                  </div>
                  <button onClick={ulozSkore} disabled={ukladam}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
                    style={{ backgroundColor: "#801A28" }}>
                    {ukladam ? "..." : "Ulozit"}
                  </button>
                  <button onClick={() => setEditZapas(null)}
                    className="rounded-lg px-3 py-2 text-xs font-medium border border-zinc-200 hover:bg-zinc-50">
                    Zrusit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {jeEditor && vsechnyOdehrany && (
        <button onClick={() => setZobrazFinal(true)}
          className="w-full rounded-full py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: "#801A28" }}>
          Zobrazit konecne vysledky
        </button>
      )}
    </div>
  );
}

// ---------- MEXICANO ----------

type MexKolo = {
  cislo: number;
  kurty: { kurt: number; tym1: string[]; tym2: string[] }[];
  vysledky: { kurt: number; vitez: "tym1" | "tym2" | null; skore?: string }[];
};

function MexicanoView({ hra, ucastnici, jeEditor }: {
  hra: Hra;
  ucastnici: Ucastnik[];
  jeEditor: boolean;
}) {
  const supabase = createClient();
  const settings = hra.settings;
  const minutNaKolo = settings?.minut_na_kolo ?? 12;
  const cislaKurtu = (settings?.cisla_kurtu ?? Array.from({ length: hra.pocet_kurtu }, (_, i) => i + 1)).sort((a, b) => a - b);

  // Odpocet
  const [sekundy, setSekundy] = useState(minutNaKolo * 60);
  const [bezi, setBezi] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (bezi) {
      intervalRef.current = setInterval(() => {
        setSekundy(s => {
          if (s <= 1) { clearInterval(intervalRef.current!); setBezi(false); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [bezi]);

  function formatCas(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  function resetujCas() { setBezi(false); setSekundy(minutNaKolo * 60); }

  // Kola
  const [kola, setKola] = useState<MexKolo[]>([]);
  const [aktivniKolo, setAktivniKolo] = useState(1);

  // Inicializace kola 1 — nahodne rozlosovani
  useEffect(() => {
    if (ucastnici.length === 0 || kola.length > 0) return;
    const zamichani = [...ucastnici].sort(() => Math.random() - 0.5);
    const kurtyKola1 = cislaKurtu.map((kurt, i) => {
      const base = i * 4;
      return {
        kurt,
        tym1: [zamichani[base]?.jmeno ?? "?", zamichani[base + 1]?.jmeno ?? "?"],
        tym2: [zamichani[base + 2]?.jmeno ?? "?", zamichani[base + 3]?.jmeno ?? "?"],
      };
    });
    setKola([{ cislo: 1, kurty: kurtyKola1, vysledky: cislaKurtu.map(k => ({ kurt: k, vitez: null })) }]);
  }, [ucastnici]);

  // Nove kolo
  const [novePary, setNovePary] = useState<{ kurt: number; tym1: string[]; tym2: string[] }[]>([]);
  const [pridavamKolo, setPridavamKolo] = useState(false);

  function pripravNoveKolo() {
    const predchoziKolo = kola[kola.length - 1];
    // Doporuceni pohybu
    const pohyby = predchoziKolo.kurty.map((k) => {
      const vysledek = predchoziKolo.vysledky.find(v => v.kurt === k.kurt);
      const vitezPar = vysledek?.vitez === "tym1" ? k.tym1 : vysledek?.vitez === "tym2" ? k.tym2 : null;
      const porazenyPar = vitezPar ? (vysledek?.vitez === "tym1" ? k.tym2 : k.tym1) : null;
      const minKurt = cislaKurtu[0];
      const maxKurt = cislaKurtu[cislaKurtu.length - 1];
      const vitezKurt = k.kurt === minKurt ? k.kurt : k.kurt - 1;
      const porazKurt = k.kurt === maxKurt ? k.kurt : k.kurt + 1;
      return { kurt: k.kurt, vitezPar, porazenyPar, vitezKurt, porazKurt };
    });
    setPridavamKolo(true);
    setNovePary(cislaKurtu.map(kurt => ({ kurt, tym1: ["", ""], tym2: ["", ""] })));
    return pohyby;
  }

  const [pohybInfo, setPohybInfo] = useState<{ kurt: number; vitezPar: string[] | null; porazenyPar: string[] | null; vitezKurt: number; porazKurt: number }[]>([]);

  function otevriNoveKolo() {
    const pohyby = pripravNoveKolo();
    setPohybInfo(pohyby);
  }

  function updateNovyPar(kurtCislo: number, tym: "tym1" | "tym2", idx: number, hodnota: string) {
    setNovePary(prev => prev.map(p => {
      if (p.kurt !== kurtCislo) return p;
      const novyTym = [...p[tym]];
      novyTym[idx] = hodnota;
      return { ...p, [tym]: novyTym };
    }));
  }

  function ulozNoveKolo() {
    const noveCislo = kola.length + 1;
    setKola(prev => [...prev, {
      cislo: noveCislo,
      kurty: novePary,
      vysledky: cislaKurtu.map(k => ({ kurt: k, vitez: null })),
    }]);
    setAktivniKolo(noveCislo);
    setPridavamKolo(false);
    setPohybInfo([]);
  }

  function zapisVysledek(kurtCislo: number, vitez: "tym1" | "tym2") {
    setKola(prev => prev.map((k, i) => {
      if (i !== aktivniKolo - 1) return k;
      return {
        ...k,
        vysledky: k.vysledky.map(v => v.kurt === kurtCislo ? { ...v, vitez } : v),
      };
    }));
  }

  const aktivniKoloData = kola[aktivniKolo - 1];

  return (
    <div className="flex flex-col gap-6">

      {/* Odpocet */}
      <section className="bg-white rounded-2xl border border-zinc-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>Kolo {aktivniKolo} — odpocet</h2>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: bezi ? "#dcfce7" : "#f3f4f6", color: bezi ? "#16a34a" : "#6b7280" }}>
            {bezi ? "Bezi" : sekundy === minutNaKolo * 60 ? "Pripraveno" : "Pozastaveno"}
          </span>
        </div>
        <div className="text-center mb-6">
          <span className="text-6xl font-bold tabular-nums" style={{ color: sekundy < 60 ? "#801A28" : "#0A0A0A" }}>
            {formatCas(sekundy)}
          </span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setBezi(!bezi)}
            className="flex-1 rounded-full py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: "#801A28" }}>
            {bezi ? "Pozastavit" : sekundy === minutNaKolo * 60 ? "Spustit kolo" : "Pokracovat"}
          </button>
          <button onClick={resetujCas}
            className="rounded-full px-5 py-3 text-sm font-semibold border border-zinc-200 hover:bg-zinc-50"
            style={{ color: "#374151" }}>
            Reset
          </button>
        </div>
      </section>

      {/* Aktualni kolo — kurty */}
      {aktivniKoloData && (
        <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>Kurty — kolo {aktivniKolo}</h2>
            <div className="flex gap-1">
              {kola.map(k => (
                <button key={k.cislo} onClick={() => setAktivniKolo(k.cislo)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ backgroundColor: aktivniKolo === k.cislo ? "#801A28" : "transparent", color: aktivniKolo === k.cislo ? "white" : "#6b7280" }}>
                  {k.cislo}.
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-zinc-50">
            {aktivniKoloData.kurty.map(k => {
              const vysledek = aktivniKoloData.vysledky.find(v => v.kurt === k.kurt);
              return (
                <div key={k.kurt} className="px-5 py-4">
                  <p className="text-xs font-medium mb-3" style={{ color: "#9ca3af" }}>Kurt {k.kurt}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-right">
                      <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>{k.tym1[0]}</p>
                      <p className="text-xs" style={{ color: "#6b7280" }}>{k.tym1[1]}</p>
                    </div>
                    <span className="text-sm font-medium shrink-0" style={{ color: "#9ca3af" }}>vs</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>{k.tym2[0]}</p>
                      <p className="text-xs" style={{ color: "#6b7280" }}>{k.tym2[1]}</p>
                    </div>
                  </div>

                  {/* Zapis vysledku */}
                  {jeEditor && aktivniKolo === kola.length && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => zapisVysledek(k.kurt, "tym1")}
                        className={`flex-1 rounded-lg py-2 text-xs font-semibold border-2 transition-all ${vysledek?.vitez === "tym1" ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                        Vyhrali: {k.tym1[0]} / {k.tym1[1]}
                      </button>
                      <button onClick={() => zapisVysledek(k.kurt, "tym2")}
                        className={`flex-1 rounded-lg py-2 text-xs font-semibold border-2 transition-all ${vysledek?.vitez === "tym2" ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                        Vyhrali: {k.tym2[0]} / {k.tym2[1]}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pohyb + nove kolo */}
      {jeEditor && !pridavamKolo && (
        <button onClick={otevriNoveKolo}
          className="w-full rounded-full py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: "#801A28" }}>
          Zapsat dalsi kolo
        </button>
      )}

      {/* Doporuceni pohybu + formular noveho kola */}
      {pridavamKolo && (
        <section className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col gap-5">
          <h2 className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>Kolo {kola.length + 1} — zadej pary na kurtech</h2>

          {/* Doporuceni */}
          {pohybInfo.length > 0 && (
            <div className="rounded-xl p-4 flex flex-col gap-2" style={{ backgroundColor: "#F2EDE4" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#801A28" }}>Doporuceny pohyb hracu:</p>
              {pohybInfo.map(p => (
                <div key={p.kurt} className="text-xs" style={{ color: "#374151" }}>
                  <span className="font-medium">Kurt {p.kurt}:</span>{" "}
                  {p.vitezPar ? <span>vitezove ({p.vitezPar.join(", ")}) jdou na kurt {p.vitezKurt}</span> : <span>vysledek nezadan</span>}
                  {p.porazenyPar ? <span> · porazeni ({p.porazenyPar.join(", ")}) jdou na kurt {p.porazKurt}</span> : null}
                </div>
              ))}
            </div>
          )}

          {/* Formular par */}
          {novePary.map(p => (
            <div key={p.kurt} className="flex flex-col gap-2">
              <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>Kurt {p.kurt}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <p className="text-xs" style={{ color: "#9ca3af" }}>Par A</p>
                  <input placeholder="Hrac 1" value={p.tym1[0]} onChange={e => updateNovyPar(p.kurt, "tym1", 0, e.target.value)}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                  <input placeholder="Hrac 2" value={p.tym1[1]} onChange={e => updateNovyPar(p.kurt, "tym1", 1, e.target.value)}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs" style={{ color: "#9ca3af" }}>Par B</p>
                  <input placeholder="Hrac 3" value={p.tym2[0]} onChange={e => updateNovyPar(p.kurt, "tym2", 0, e.target.value)}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                  <input placeholder="Hrac 4" value={p.tym2[1]} onChange={e => updateNovyPar(p.kurt, "tym2", 1, e.target.value)}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <button onClick={() => { setPridavamKolo(false); setPohybInfo([]); }}
              className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-200"
              style={{ color: "#374151" }}>
              Zrusit
            </button>
            <button onClick={ulozNoveKolo}
              className="flex-1 rounded-full py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: "#801A28" }}>
              Ulozit kolo {kola.length + 1}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// ---------- HLAVNI STRANKA ----------

export default function HraDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [hra, setHra] = useState<Hra | null>(null);
  const [ucastnici, setUcastnici] = useState<Ucastnik[]>([]);
  const [zapasy, setZapasy] = useState<Zapas[]>([]);
  const [jeEditor, setJeEditor] = useState(false);
  const [loading, setLoading] = useState(true);

  const nactiData = useCallback(async () => {
    const [{ data: hraData }, { data: ucastData }, { data: zapasyData }, { data: { user } }] = await Promise.all([
      supabase.from("hry").select("*").eq("id", id).single(),
      supabase.from("hra_ucastnici").select("*").eq("hra_id", id),
      supabase.from("hra_zapasy").select("*").eq("hra_id", id).order("kolo").order("kurt"),
      supabase.auth.getUser(),
    ]);
    setHra(hraData);
    setUcastnici(ucastData ?? []);
    setZapasy(zapasyData ?? []);
    if (user && hraData) {
      if (hraData.created_by === user.id) { setJeEditor(true); }
      else {
        const { data: ed } = await supabase.from("hra_editatori").select("id").eq("hra_id", id).eq("user_id", user.id).single();
        setJeEditor(!!ed);
      }
    }
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => { nactiData(); }, [nactiData]);

  if (loading) return (
    <div className="flex flex-col min-h-screen"><Navbar />
      <main className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#F2EDE4" }}>
        <p className="text-sm" style={{ color: "#9ca3af" }}>Nacitam...</p>
      </main>
    </div>
  );

  if (!hra) return (
    <div className="flex flex-col min-h-screen"><Navbar />
      <main className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#F2EDE4" }}>
        <p className="text-sm" style={{ color: "#9ca3af" }}>Hra nenalezena.</p>
      </main>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-10" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="max-w-3xl mx-auto">

          <div className="mb-8">
            <a href="/hry" className="text-sm hover:underline" style={{ color: "#801A28" }}>Zpet na hry</a>
            <div className="flex items-start justify-between gap-4 mt-3">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#801A28" }}>{hra.nazev}</h1>
                <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                  {hra.typ.charAt(0).toUpperCase() + hra.typ.slice(1)}
                  {" · "}{hra.pocet_kurtu} {hra.pocet_kurtu === 1 ? "kurt" : "kurty"}
                  {hra.typ === "mexicano" && hra.settings?.minut_na_kolo ? ` · ${hra.settings.minut_na_kolo} min/kolo` : ""}
                  {hra.typ !== "mexicano" ? ` · ${hra.body_na_zapas} bodu` : ""}
                </p>
              </div>
              <span className="text-xs font-medium px-3 py-1.5 rounded-full shrink-0"
                style={{ backgroundColor: hra.stav === "probiha" ? "#dcfce7" : "#f3f4f6", color: hra.stav === "probiha" ? "#16a34a" : "#6b7280" }}>
                {hra.stav === "probiha" ? "Probiha" : "Ukonceno"}
              </span>
            </div>
          </div>

          {hra.typ === "americano" && (
            <AmericanoView hra={hra} ucastnici={ucastnici} zapasy={zapasy} jeEditor={jeEditor} nactiData={nactiData} />
          )}
          {hra.typ === "mexicano" && (
            <MexicanoView hra={hra} ucastnici={ucastnici} jeEditor={jeEditor} />
          )}
          {hra.typ === "turnaj" && (
            <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center">
              <p className="font-semibold mb-2" style={{ color: "#0A0A0A" }}>Turnajovy dashboard</p>
              <p className="text-sm" style={{ color: "#6b7280" }}>Pripravujeme — brzy zde bude rozpis skupin, tabulky a harmonogram.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
