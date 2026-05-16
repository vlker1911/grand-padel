"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
    minut_presunu?: number;
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

// ---------- OHNOSTROJ ----------

function OhnostrojOverlay({ vitez, onDone }: { vitez: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 7000);
    return () => clearTimeout(t);
  }, [onDone]);

  const particles = useMemo(() => {
    const bursts = [
      [12, 18], [50, 8], [82, 22], [8, 60], [72, 50],
      [35, 78], [88, 15], [28, 42], [60, 30], [45, 65],
    ];
    const colors = ["#f59e0b", "#fbbf24", "#ef4444", "#801A28", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#ffffff"];
    return bursts.flatMap(([bx, by], bi) =>
      Array.from({ length: 14 }, (_, pi) => ({
        id: `${bi}-${pi}`,
        bx, by,
        angle: (pi / 14) * 360,
        color: colors[(bi * 4 + pi) % colors.length],
        delay: bi * 0.55 + (pi % 3) * 0.05,
        size: 5 + (pi % 4) * 2,
      }))
    );
  }, []);

  return (
    <>
      <style>{`
        @keyframes oh-burst {
          0%   { transform: rotate(var(--a)) translateX(0px) scale(0.2); opacity: 0; }
          8%   { transform: rotate(var(--a)) translateX(0px) scale(1);   opacity: 1; }
          70%  { opacity: 0.7; }
          85%  { transform: rotate(var(--a)) translateX(150px) scale(0.1); opacity: 0; }
          100% { transform: rotate(var(--a)) translateX(0px) scale(0);   opacity: 0; }
        }
        @keyframes oh-fadein {
          from { opacity: 0; transform: scale(0.85) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes oh-pulse {
          0%, 100% { text-shadow: 0 0 30px #f59e0b88; }
          50%       { text-shadow: 0 0 80px #f59e0bcc; }
        }
      `}</style>
      <div
        onClick={onDone}
        style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        {particles.map(p => (
          <div key={p.id} style={{
            position: "absolute",
            left: `calc(${p.bx}% - ${p.size / 2}px)`,
            top: `calc(${p.by}% - ${p.size / 2}px)`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: p.color,
            ["--a" as string]: `${p.angle}deg`,
            animation: `oh-burst 2.8s ${p.delay}s ease-out infinite`,
          }} />
        ))}
        <div style={{ textAlign: "center", color: "white", position: "relative", zIndex: 1, animation: "oh-fadein 0.7s 0.2s ease-out both" }}>
          <p style={{ fontSize: "1rem", opacity: 0.7, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Gratulejeme k vitezstvi
          </p>
          <p style={{ fontSize: "3rem", fontWeight: 900, color: "#f59e0b", animation: "oh-pulse 2s ease-in-out infinite", lineHeight: 1.1 }}>
            {vitez}
          </p>
          <p style={{ fontSize: "0.7rem", marginTop: "3rem", opacity: 0.35, letterSpacing: "0.08em" }}>
            klepni pro pokracovani
          </p>
        </div>
      </div>
    </>
  );
}

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
  const [scoreMap, setScoreMap] = useState<Record<string, { s1: string; s2: string }>>({});
  const [upravitId, setUpravitId] = useState<string | null>(null);
  const [ukladam, setUkladam] = useState<string | null>(null);
  const [zobrazOhnostroj, setZobrazOhnostroj] = useState(false);
  const ohnostrojUkazan = useRef(false);

  const limit = hra.body_na_zapas;
  const kola = [...new Set(zapasy.map(z => z.kolo))].sort((a, b) => a - b);
  const zapasyKola = zapasy.filter(z => z.kolo === aktivniKolo);
  const vsechnyOdehrany = zapasy.length > 0 && zapasy.every(z => z.skore_tym1 != null);

  useEffect(() => {
    if (vsechnyOdehrany && !ohnostrojUkazan.current) {
      ohnostrojUkazan.current = true;
      setZobrazOhnostroj(true);
    }
  }, [vsechnyOdehrany]);

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

  function getScore(id: string) { return scoreMap[id] ?? { s1: "", s2: "" }; }

  function updateScore(id: string, field: "s1" | "s2", val: string) {
    const n = parseInt(val);
    if (!isNaN(n) && n >= 0 && n <= limit) {
      const other = String(limit - n);
      setScoreMap(prev => ({ ...prev, [id]: field === "s1" ? { s1: val, s2: other } : { s1: other, s2: val } }));
    } else {
      setScoreMap(prev => ({ ...prev, [id]: { ...getScore(id), [field]: val } }));
    }
  }

  async function ulozSkore(zapasId: string) {
    const sc = getScore(zapasId);
    const s1 = parseInt(sc.s1), s2 = parseInt(sc.s2);
    if (isNaN(s1) || isNaN(s2)) return;
    setUkladam(zapasId);
    await supabase.from("hra_zapasy").update({ skore_tym1: s1, skore_tym2: s2, stav: "ukonceno" }).eq("id", zapasId);
    setUpravitId(null);
    nactiData();
    setUkladam(null);
  }

  return (
    <div className="flex flex-col gap-6">

      {zobrazOhnostroj && (
        <OhnostrojOverlay vitez={tabulka[0]?.jmeno ?? ""} onDone={() => setZobrazOhnostroj(false)} />
      )}

      {/* Tabulka */}
      <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>Prubezna tabulka</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr style={{ backgroundColor: "#fafafa" }}>
                <th className="text-left pl-5 pr-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>#</th>
                <th className="text-left px-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>Hrac</th>
                <th className="text-center px-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>V</th>
                <th className="text-center px-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>R</th>
                <th className="text-center px-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>P</th>
                <th className="text-center px-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>P+</th>
                <th className="text-center px-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>P-</th>
                <th className="text-center px-2 pr-5 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>+/-</th>
              </tr>
            </thead>
            <tbody>
              {tabulka.map((h, i) => (
                <tr key={h.id} className="border-t border-zinc-50">
                  <td className="pl-5 pr-2 py-3 font-bold text-xs" style={{ color: i === 0 ? "#801A28" : "#9ca3af" }}>{i + 1}</td>
                  <td className="px-2 py-3 font-semibold" style={{ color: "#0A0A0A" }}>{h.jmeno}</td>
                  <td className="px-2 py-3 text-center text-xs font-medium" style={{ color: "#16a34a" }}>{h.vyhry}</td>
                  <td className="px-2 py-3 text-center text-xs font-medium" style={{ color: "#6b7280" }}>{h.remisy}</td>
                  <td className="px-2 py-3 text-center text-xs font-medium" style={{ color: "#dc2626" }}>{h.prohry}</td>
                  <td className="px-2 py-3 text-center text-xs font-bold" style={{ color: "#801A28" }}>{h.body}</td>
                  <td className="px-2 py-3 text-center text-xs" style={{ color: "#6b7280" }}>{h.obdrzeno}</td>
                  <td className="px-2 pr-5 py-3 text-center text-xs font-semibold" style={{ color: h.rozdil >= 0 ? "#16a34a" : "#dc2626" }}>
                    {h.rozdil >= 0 ? "+" : ""}{h.rozdil}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          {zapasyKola.map(z => {
            const sc = getScore(z.id);
            const jeUpravovany = upravitId === z.id;
            const jeNezadany = z.skore_tym1 == null;
            const zobrazInputy = jeEditor && (jeNezadany || jeUpravovany);

            return (
              <div key={z.id} className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-medium shrink-0 w-12" style={{ color: "#9ca3af" }}>Kurt {z.kurt}</p>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 text-right">
                      <p className="text-sm font-semibold leading-tight" style={{ color: "#0A0A0A" }}>{jmeno(z.tym1_hrac1_id)}</p>
                      <p className="text-xs leading-tight" style={{ color: "#6b7280" }}>{jmeno(z.tym1_hrac2_id)}</p>
                    </div>
                    {zobrazInputy ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input type="number" min={0} max={limit} value={sc.s1}
                          onChange={e => updateScore(z.id, "s1", e.target.value)}
                          placeholder="—"
                          className="w-12 rounded-lg border-2 border-[#801A28] px-1 py-2 text-center text-sm font-bold focus:outline-none" />
                        <span className="font-bold text-sm" style={{ color: "#9ca3af" }}>:</span>
                        <input type="number" min={0} max={limit} value={sc.s2}
                          onChange={e => updateScore(z.id, "s2", e.target.value)}
                          placeholder="—"
                          className="w-12 rounded-lg border-2 border-[#801A28] px-1 py-2 text-center text-sm font-bold focus:outline-none" />
                      </div>
                    ) : (
                      <div className="shrink-0 text-center w-16">
                        {z.skore_tym1 != null
                          ? <span className="text-base font-bold" style={{ color: "#0A0A0A" }}>{z.skore_tym1} : {z.skore_tym2}</span>
                          : <span className="text-sm" style={{ color: "#9ca3af" }}>vs</span>}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold leading-tight" style={{ color: "#0A0A0A" }}>{jmeno(z.tym2_hrac1_id)}</p>
                      <p className="text-xs leading-tight" style={{ color: "#6b7280" }}>{jmeno(z.tym2_hrac2_id)}</p>
                    </div>
                  </div>
                  {jeEditor && z.skore_tym1 != null && !jeUpravovany && (
                    <button onClick={() => {
                      setUpravitId(z.id);
                      setScoreMap(prev => ({ ...prev, [z.id]: { s1: String(z.skore_tym1), s2: String(z.skore_tym2) } }));
                    }}
                      className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
                      style={{ color: "#801A28" }}>
                      Upravit
                    </button>
                  )}
                </div>
                {zobrazInputy && (
                  <div className="mt-3 flex gap-2 justify-end">
                    {(() => {
                      const sc2 = getScore(z.id);
                      const platne = !isNaN(parseInt(sc2.s1)) && !isNaN(parseInt(sc2.s2)) && sc2.s1 !== "" && sc2.s2 !== "";
                      return (
                        <button onClick={() => ulozSkore(z.id)} disabled={ukladam === z.id || !platne}
                          className="rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                          style={{ backgroundColor: "#801A28" }}>
                          {ukladam === z.id ? "..." : "Ulozit"}
                        </button>
                      );
                    })()}
                    {jeUpravovany && (
                      <button onClick={() => setUpravitId(null)}
                        className="rounded-lg px-3 py-2 text-xs font-medium border border-zinc-200 hover:bg-zinc-50">
                        Zrusit
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

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
  const minutPresunu = settings?.minut_presunu ?? 3;
  const casOd = settings?.cas_od ?? null;
  const casDo = settings?.cas_do ?? null;
  const maxKurtu = Math.floor(ucastnici.length / 4);
  const cislaKurtu = (settings?.cisla_kurtu ?? Array.from({ length: hra.pocet_kurtu }, (_, i) => i + 1))
    .sort((a, b) => a - b)
    .slice(0, maxKurtu);

  const maxKol = (() => {
    if (!casOd || !casDo) return null;
    const [hOd, mOd] = casOd.split(":").map(Number);
    const [hDo, mDo] = casDo.split(":").map(Number);
    const celkem = (hDo * 60 + mDo) - (hOd * 60 + mOd);
    return Math.floor(celkem / (minutNaKolo + minutPresunu));
  })();

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

  const [pohybInfo, setPohybInfo] = useState<{ kurt: number; vitezPar: string[] | null; porazenyPar: string[] | null; vitezKurt: number; porazKurt: number }[]>([]);
  const [aktivniSuggestion, setAktivniSuggestion] = useState<string | null>(null);
  const [navrhyPerKurt, setNavrhyPerKurt] = useState<Record<number, string[]>>({});
  const [upravitKolo, setUpravitKolo] = useState<number | null>(null);

  function otevriNoveKolo() {
    const predchoziKolo = kola[kola.length - 1];
    const minKurt = cislaKurtu[0];
    const maxKurt = cislaKurtu[cislaKurtu.length - 1];

    const pohyby = predchoziKolo.kurty.map((k) => {
      const vysledek = predchoziKolo.vysledky.find(v => v.kurt === k.kurt);
      const vitezPar = vysledek?.vitez === "tym1" ? k.tym1 : vysledek?.vitez === "tym2" ? k.tym2 : null;
      const porazenyPar = vitezPar ? (vysledek?.vitez === "tym1" ? k.tym2 : k.tym1) : null;
      const vitezKurt = k.kurt === minKurt ? k.kurt : k.kurt - 1;
      const porazKurt = k.kurt === maxKurt ? k.kurt : k.kurt + 1;
      return { kurt: k.kurt, vitezPar, porazenyPar, vitezKurt, porazKurt };
    });

    // Uloz navrzene hrace per kurt pro autocomplete
    const navrhy: Record<number, string[]> = {};
    cislaKurtu.forEach(k => { navrhy[k] = []; });
    pohyby.forEach(p => {
      if (p.vitezPar) navrhy[p.vitezKurt] = [...(navrhy[p.vitezKurt] ?? []), ...p.vitezPar];
      if (p.porazenyPar) navrhy[p.porazKurt] = [...(navrhy[p.porazKurt] ?? []), ...p.porazenyPar];
    });
    setNavrhyPerKurt(navrhy);

    const predvyplnene = cislaKurtu.map(kurt => {
      const hraci = navrhy[kurt] ?? [];
      return { kurt, tym1: [hraci[0] ?? "", hraci[1] ?? ""], tym2: [hraci[2] ?? "", hraci[3] ?? ""] };
    });
    setPridavamKolo(true);
    setNovePary(predvyplnene);
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

  const dosloNaMaxKol = maxKol !== null && kola.length >= maxKol;

  return (
    <div className="flex flex-col gap-6">

      {/* Info bar — rezervace */}
      <section className="bg-white rounded-2xl border border-zinc-100 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: "#374151" }}>
          <span><strong>{cislaKurtu.length}</strong> {cislaKurtu.length === 1 ? "kurt" : "kurty"} ({cislaKurtu.join(", ")})</span>
          <span style={{ color: "#d1d5db" }}>·</span>
          <span><strong>{ucastnici.length}</strong> hracu</span>
          {casOd && casDo && <><span style={{ color: "#d1d5db" }}>·</span><span>{casOd} – {casDo}</span></>}
          <span style={{ color: "#d1d5db" }}>·</span>
          <span>{minutNaKolo} min/kolo + {minutPresunu} min presun</span>
          {maxKol !== null && (
            <>
              <span style={{ color: "#d1d5db" }}>·</span>
              <span className="font-semibold" style={{ color: kola.length >= maxKol ? "#801A28" : "#16a34a" }}>
                kolo {kola.length} / {maxKol}
              </span>
            </>
          )}
        </div>
      </section>

      {/* Upozorneni — konec casu */}
      {dosloNaMaxKol && (
        <div className="rounded-2xl px-5 py-4 text-sm font-semibold text-white text-center" style={{ backgroundColor: "#801A28" }}>
          Dosahl jsi maximalniho poctu kol ({maxKol}) pro rezervaci {casOd}–{casDo}.
        </div>
      )}

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
            <div className="flex gap-1 flex-wrap">
              {kola.map(k => (
                <button key={k.cislo} onClick={() => { setAktivniKolo(k.cislo); setUpravitKolo(null); }}
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

                  {/* Zapis / oprava vysledku */}
                  {jeEditor && (aktivniKolo === kola.length || upravitKolo === aktivniKolo) && (
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

      {/* Tlacitko upravit minule kolo */}
      {jeEditor && aktivniKoloData && aktivniKolo < kola.length && (
        <div className="flex justify-end">
          {upravitKolo === aktivniKolo ? (
            <button onClick={() => setUpravitKolo(null)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium hover:bg-zinc-50"
              style={{ color: "#374151" }}>
              Hotovo
            </button>
          ) : (
            <button onClick={() => setUpravitKolo(aktivniKolo)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium hover:bg-zinc-50"
              style={{ color: "#801A28" }}>
              Upravit kolo {aktivniKolo}
            </button>
          )}
        </div>
      )}

      {/* Pohyb + nove kolo */}
      {jeEditor && !pridavamKolo && (
        <button onClick={otevriNoveKolo} disabled={dosloNaMaxKol}
          className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#801A28" }}>
          {dosloNaMaxKol
            ? `Max kol dosazeno (${maxKol})`
            : "Zapsat dalsi kolo"}
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
                {(["tym1", "tym2"] as const).map((tym, ti) => (
                  <div key={tym} className="flex flex-col gap-1">
                    <p className="text-xs" style={{ color: "#9ca3af" }}>Par {ti === 0 ? "A" : "B"}</p>
                    {[0, 1].map(idx => {
                      const fieldKey = `${p.kurt}-${tym}-${idx}`;
                      const hodnota = p[tym][idx];
                      const kurtoviHraci = navrhyPerKurt[p.kurt] ?? ucastnici.map(u => u.jmeno);
                      const filtrovani = kurtoviHraci.filter(h =>
                        h.toLowerCase().includes(hodnota.toLowerCase()) && h !== hodnota
                      );
                      const seznam = hodnota.length === 0 ? kurtoviHraci : filtrovani;
                      return (
                        <div key={idx} className="relative">
                          <input
                            placeholder={`Hrac ${ti * 2 + idx + 1}`}
                            value={hodnota}
                            onChange={e => { updateNovyPar(p.kurt, tym, idx, e.target.value); setAktivniSuggestion(fieldKey); }}
                            onFocus={() => setAktivniSuggestion(fieldKey)}
                            onBlur={() => setTimeout(() => setAktivniSuggestion(null), 150)}
                            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]"
                          />
                          {aktivniSuggestion === fieldKey && seznam.length > 0 && (
                            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-md overflow-hidden">
                              {seznam.map(hrac => (
                                <button key={hrac} type="button"
                                  onMouseDown={() => { updateNovyPar(p.kurt, tym, idx, hrac); setAktivniSuggestion(null); }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0"
                                  style={{ color: "#374151" }}>
                                  {hrac}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
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
