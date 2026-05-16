"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
    zruseno?: boolean;
    duvod_zruseni?: string;
    zruseno_at?: string;
    scoring_typ?: "gamy" | "body" | "cas";
    scoring_limit?: number;
    scoring_limit_playoff?: number;
    playoff?: boolean;
    typ_playoff?: "krizovy" | "primy";
    multi_tier?: boolean;
    typ_parovani?: "pary" | "singles" | "mix";
    popis?: string;
    pravidla?: string;
    rezim_kurtu?: "auto" | "1-1" | "2-1";
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

function OhnostrojOverlay({ vitez, poradi, onDone }: { vitez: string; poradi: { jmeno: string; body: number }[]; onDone: () => void }) {
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
        <div style={{ textAlign: "center", color: "white", position: "relative", zIndex: 1, animation: "oh-fadein 0.7s 0.2s ease-out both", maxWidth: "320px", width: "100%" }}>
          <p style={{ fontSize: "0.85rem", opacity: 0.65, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Gratulejeme k vitezstvi
          </p>
          <p style={{ fontSize: "2.75rem", fontWeight: 900, color: "#f59e0b", animation: "oh-pulse 2s ease-in-out infinite", lineHeight: 1.1, marginBottom: "1.75rem" }}>
            {vitez}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {poradi.map((h, i) => (
              <div key={h.jmeno} style={{ display: "flex", alignItems: "center", gap: "0.75rem", opacity: i === 0 ? 1 : i === 1 ? 0.85 : i === 2 ? 0.72 : 0.5 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : i === 2 ? "#cd7c32" : "#6b7280", width: "1.25rem", textAlign: "right", flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ flex: 1, textAlign: "left", fontSize: i === 0 ? "1rem" : "0.85rem", fontWeight: i < 3 ? 700 : 400 }}>{h.jmeno}</span>
                <span style={{ fontSize: i === 0 ? "1rem" : "0.85rem", fontWeight: 700, color: i === 0 ? "#f59e0b" : "white" }}>{h.body} b</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.65rem", marginTop: "2rem", opacity: 0.3, letterSpacing: "0.08em" }}>
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
        <OhnostrojOverlay
          vitez={tabulka[0]?.jmeno ?? ""}
          poradi={tabulka.map(h => ({ jmeno: h.jmeno, body: h.body }))}
          onDone={() => setZobrazOhnostroj(false)}
        />
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

      {jeEditor && vsechnyOdehrany && (
        <button onClick={() => setZobrazOhnostroj(true)}
          className="w-full rounded-full py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: "#801A28" }}>
          Vyhodnotit
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

// ---------- TURNAJ ----------

type TurnajTym = {
  id: string;
  hra_id: string;
  nazev: string;
  hrac1_id: string | null;
  hrac2_id: string | null;
  skupina: string;
  nasazeni: number;
};

type TurnajZapas = {
  id: string;
  hra_id: string;
  faze: string;
  skupina: string | null;
  kolo: number | null;
  tym1_id: string;
  tym2_id: string;
  skore_tym1: number | null;
  skore_tym2: number | null;
  vitez_id: string | null;
  kurt: number | null;
  poradi_fronta: number | null;
  cas_zacatek: string | null;
  cas_konec: string | null;
  umisteni: string | null;
  stav: string;
  created_at: string | null;
};

type TurnajSettings = {
  scoring_typ?: "gamy" | "body" | "cas";
  scoring_limit?: number;
  scoring_limit_playoff?: number;
  playoff?: boolean;
  typ_playoff?: "krizovy" | "primy";
  multi_tier?: boolean;
};

type HarmonogramZaznam = {
  zapasId: string;
  kurt: number;
  casStartMin: number;
  casEndMin: number;
};

function casMinToStr(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function spocitejHarmonogram(
  zapasy: TurnajZapas[],
  pocetKurtu: number,
  casOdStr: string | undefined,
  scoringTyp: "gamy" | "body" | "cas",
  scoringLimit: number,
  scoringLimitPlayoff: number,
): HarmonogramZaznam[] {
  const startMin = casOdStr
    ? (() => { const [h, m] = casOdStr.split(":").map(Number); return h * 60 + m; })()
    : 9 * 60;
  const prechod = 3;

  function delkaZapasu(z: TurnajZapas) {
    const lim = z.faze === "skupina" ? scoringLimit : scoringLimitPlayoff;
    if (scoringTyp === "gamy") return lim * 3 + 5;
    if (scoringTyp === "cas")  return lim + 3;
    return Math.round(lim * 0.45) + 5;
  }

  // Kurty 1..pocetKurtu, každý volný od startMin
  const kurtyVolne: number[] = Array.from({ length: pocetKurtu }, () => startMin);
  const kurtyIndexy: number[] = Array.from({ length: pocetKurtu }, (_, i) => i + 1);

  const result: HarmonogramZaznam[] = [];

  // Skupiny nejdřív, pak playoff
  const serazene = [
    ...zapasy.filter(z => z.faze === "skupina"),
    ...zapasy.filter(z => z.faze !== "skupina"),
  ];

  for (const z of serazene) {
    // Nejdříve volný kurt
    let nejdrivIdx = 0;
    for (let i = 1; i < pocetKurtu; i++) {
      if (kurtyVolne[i] < kurtyVolne[nejdrivIdx]) nejdrivIdx = i;
    }
    const kurt = kurtyIndexy[nejdrivIdx];
    const start = kurtyVolne[nejdrivIdx];
    const delka = delkaZapasu(z);
    kurtyVolne[nejdrivIdx] = start + delka + prechod;
    result.push({ zapasId: z.id, kurt, casStartMin: start, casEndMin: start + delka });
  }

  return result;
}

function skupinaTabulka(tymy: TurnajTym[], zapasy: TurnajZapas[]) {
  const stats: Record<string, { vyhry: number; remisy: number; prohry: number; skore: number; obdrzeno: number }> = {};
  tymy.forEach(t => { stats[t.id] = { vyhry: 0, remisy: 0, prohry: 0, skore: 0, obdrzeno: 0 }; });
  for (const z of zapasy) {
    if (z.skore_tym1 == null || z.skore_tym2 == null) continue;
    const s1 = z.skore_tym1, s2 = z.skore_tym2;
    if (stats[z.tym1_id]) { stats[z.tym1_id].skore += s1; stats[z.tym1_id].obdrzeno += s2; if (s1 > s2) stats[z.tym1_id].vyhry++; else if (s1 === s2) stats[z.tym1_id].remisy++; else stats[z.tym1_id].prohry++; }
    if (stats[z.tym2_id]) { stats[z.tym2_id].skore += s2; stats[z.tym2_id].obdrzeno += s1; if (s2 > s1) stats[z.tym2_id].vyhry++; else if (s1 === s2) stats[z.tym2_id].remisy++; else stats[z.tym2_id].prohry++; }
  }
  return tymy
    .map(t => ({ ...t, ...stats[t.id], body: stats[t.id].vyhry * 2 + stats[t.id].remisy, rozdil: stats[t.id].skore - stats[t.id].obdrzeno }))
    .sort((a, b) => b.body !== a.body ? b.body - a.body : b.rozdil - a.rozdil);
}

function generujPlayoff(
  skupiny: Record<string, TurnajTym[]>,
  zapasySkupin: TurnajZapas[],
  typPlayoff: "krizovy" | "primy",
  multiTier: boolean,
  hraId: string
): Omit<TurnajZapas, "id">[] {
  const skupNames = Object.keys(skupiny).sort();
  // Poradi v kazde skupine
  const poradi: Record<string, TurnajTym[]> = {};
  skupNames.forEach(s => {
    poradi[s] = skupinaTabulka(skupiny[s], zapasySkupin.filter(z => z.skupina === s));
  });

  const vsichniVPoradi: TurnajTym[] = [];
  const maxPos = Math.max(...skupNames.map(s => poradi[s].length));
  for (let pos = 0; pos < maxPos; pos++) {
    skupNames.forEach(s => { if (poradi[s][pos]) vsichniVPoradi.push(poradi[s][pos]); });
  }

  if (!multiTier) {
    // Jen finalni playoff (top tymy)
    const postupuji = skupNames.flatMap(s => poradi[s].slice(0, 2));
    return pairPlayoffMatches(postupuji, typPlayoff, skupNames, hraId, "playoff", 1);
  }

  // Multi-tier: vsichni hraji o sve umisteni
  const zapasy: Omit<TurnajZapas, "id">[] = [];
  const n = vsichniVPoradi.length;
  const pocetPasem = Math.ceil(n / 4);
  for (let pas = 0; pas < pocetPasem; pas++) {
    const tymy = vsichniVPoradi.slice(pas * 4, (pas + 1) * 4);
    if (tymy.length >= 2) {
      const faze = pas === 0 ? "playoff" : `playoff_pas_${pas + 1}`;
      zapasy.push(...pairPlayoffMatches(tymy, typPlayoff, skupNames, hraId, faze, pas + 1));
    }
  }
  return zapasy;
}

function pairPlayoffMatches(
  tymy: TurnajTym[],
  typPlayoff: "krizovy" | "primy",
  skupNames: string[],
  hraId: string,
  faze: string,
  kolo: number
): Omit<TurnajZapas, "id">[] {
  const zapasy: Omit<TurnajZapas, "id">[] = [];
  if (typPlayoff === "krizovy" && skupNames.length >= 2) {
    for (let i = 0; i + 1 < tymy.length; i += 2) {
      zapasy.push({ hra_id: hraId, faze, skupina: null, kolo, tym1_id: tymy[i].id, tym2_id: tymy[i + 1].id, skore_tym1: null, skore_tym2: null, vitez_id: null, kurt: null, poradi_fronta: null, cas_zacatek: null, cas_konec: null, umisteni: null, stav: "ceka", created_at: null });
    }
  } else {
    for (let i = 0; i + 1 < tymy.length; i += 2) {
      zapasy.push({ hra_id: hraId, faze, skupina: null, kolo, tym1_id: tymy[i].id, tym2_id: tymy[i + 1].id, skore_tym1: null, skore_tym2: null, vitez_id: null, kurt: null, poradi_fronta: null, cas_zacatek: null, cas_konec: null, umisteni: null, stav: "ceka", created_at: null });
    }
  }
  return zapasy;
}

function TurnajView({ hra, jeEditor }: { hra: Hra; jeEditor: boolean }) {
  const supabase = createClient();
  const settings = (hra.settings ?? {}) as TurnajSettings;
  const scoringTyp = settings.scoring_typ ?? "gamy";
  const scoringLimit = settings.scoring_limit ?? 4;
  const scoringLimitPlayoff = settings.scoring_limit_playoff ?? scoringLimit;
  const playoff = settings.playoff ?? true;
  const typPlayoff = settings.typ_playoff ?? "krizovy";
  const multiTier = settings.multi_tier ?? true;

  const [tymy, setTymy] = useState<TurnajTym[]>([]);
  const [zapasy, setZapasy] = useState<TurnajZapas[]>([]);
  const [hraciDB, setHraciDB] = useState<Ucastnik[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreMap, setScoreMap] = useState<Record<string, { s1: string; s2: string }>>({});
  const [ukladam, setUkladam] = useState<string | null>(null);
  const [upravitId, setUpravitId] = useState<string | null>(null);
  const [generujiPlayoff, setGenerujiPlayoff] = useState(false);
  type Tab = "info" | "rozlosovani" | "poradi" | "tabulky" | "scoreboard" | "hraci";
  const [aktivniTab, setAktivniTab] = useState<Tab>("info");
  const [filtrSkupiny, setFiltrSkupiny] = useState<string>("vse");
  const [hledat, setHledat] = useState("");
  const [editInfo, setEditInfo] = useState(false);
  const [popis, setPopis] = useState((hra.settings as { popis?: string })?.popis ?? "");
  const [pravidla, setPravidla] = useState((hra.settings as { pravidla?: string })?.pravidla ?? "");
  const [editNazev, setEditNazev] = useState(hra.nazev);
  const [editCasOd, setEditCasOd] = useState(hra.settings?.cas_od ?? "");
  const [editCasDo, setEditCasDo] = useState(hra.settings?.cas_do ?? "");
  const [editPocetKurtu, setEditPocetKurtu] = useState<number | "">(hra.pocet_kurtu);
  const [ukladamInfo, setUkladamInfo] = useState(false);
  const [zrusitModal, setZrusitModal] = useState(false);
  const [zrusitDuvod, setZrusitDuvod] = useState("");
  const [zrusujem, setZrusujem]   = useState(false);
  const [smazatModal, setSmazatModal] = useState(false);
  const [mazem, setMazem] = useState(false);
  const [kurtModal, setKurtModal] = useState<string | null>(null);

  const router = useRouter();

  const jeZruseno = hra.settings?.zruseno === true;

  const nactiTurnaj = useCallback(async () => {
    const [{ data: tymyData }, { data: zapasyData }, { data: hraciData }] = await Promise.all([
      supabase.from("turnaj_tymy").select("*").eq("hra_id", hra.id).order("nasazeni"),
      supabase.from("turnaj_zapasy").select("*").eq("hra_id", hra.id),
      supabase.from("hra_ucastnici").select("*").eq("hra_id", hra.id),
    ]);
    setTymy(tymyData ?? []);
    setZapasy(zapasyData ?? []);
    setHraciDB(hraciData ?? []);
    setLoading(false);
  }, [hra.id, supabase]);

  useEffect(() => { nactiTurnaj(); }, [nactiTurnaj]);

  // Skupiny
  const skupinyMap = useMemo((): Record<string, TurnajTym[]> => {
    const m: Record<string, TurnajTym[]> = {};
    tymy.forEach(t => { if (!m[t.skupina]) m[t.skupina] = []; m[t.skupina].push(t); });
    return m;
  }, [tymy]);

  const skupinyNazvy = useMemo(() => Object.keys(skupinyMap).sort(), [skupinyMap]);

  const zapasySkupin = useMemo(() => zapasy.filter(z => z.faze === "skupina"), [zapasy]);
  const zapasyPlayoff = useMemo(() => zapasy.filter(z => z.faze !== "skupina"), [zapasy]);

  const vsechnySkupinyHotove = useMemo(
    () => zapasySkupin.length > 0 && zapasySkupin.every(z => z.skore_tym1 != null),
    [zapasySkupin]
  );

  const playoffExistuje = zapasyPlayoff.length > 0;

  const vsechnyPlayoffHotove = useMemo(
    () => playoffExistuje && zapasyPlayoff.every(z => z.skore_tym1 != null),
    [playoffExistuje, zapasyPlayoff]
  );

  const vsechnoHotove = useMemo(
    () => (!playoff && vsechnySkupinyHotove) || (playoff && vsechnyPlayoffHotove),
    [playoff, vsechnySkupinyHotove, vsechnyPlayoffHotove]
  );

  // Finalni poradi: vitezove pasem playoff (nebo skupin pokud bez playoff)
  const finalniPoradi = useMemo((): { nazev: string; skore: number }[] => {
    if (!vsechnoHotove) return [];
    if (playoff && playoffExistuje) {
      // Poradi: vitez kazdeho zapasu = vyssi umisteni; remiza = tim1 vyhrál
      const fazePoradi = [...new Set(zapasyPlayoff.map(z => z.faze))].sort();
      const poradi: { nazev: string; skore: number }[] = [];
      fazePoradi.forEach(faze => {
        const zapasyFaze = zapasyPlayoff.filter(z => z.faze === faze);
        zapasyFaze.forEach(z => {
          const vitezId = (z.skore_tym1 ?? 0) >= (z.skore_tym2 ?? 0) ? z.tym1_id : z.tym2_id;
          const porazenyId = vitezId === z.tym1_id ? z.tym2_id : z.tym1_id;
          if (!poradi.find(p => p.nazev === jmenoTymu(vitezId)))
            poradi.unshift({ nazev: jmenoTymu(vitezId), skore: Math.max(z.skore_tym1 ?? 0, z.skore_tym2 ?? 0) });
          if (!poradi.find(p => p.nazev === jmenoTymu(porazenyId)))
            poradi.push({ nazev: jmenoTymu(porazenyId), skore: Math.min(z.skore_tym1 ?? 0, z.skore_tym2 ?? 0) });
        });
      });
      return poradi;
    }
    // Bez playoff — skupinova tabulka sloučená
    const vsichni = skupinyNazvy.flatMap(s => skupinaTabulka(skupinyMap[s] ?? [], zapasySkupin.filter(z => z.skupina === s)));
    return vsichni.map(t => ({ nazev: t.nazev, skore: t.skore }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vsechnoHotove, playoff, playoffExistuje, zapasyPlayoff, zapasySkupin, skupinyMap, skupinyNazvy, tymy]);

  const [zobrazOhnostroj, setZobrazOhnostroj] = useState(false);
  const ohnostrojUkazanRef = useRef(false);

  useEffect(() => {
    if (vsechnoHotove && !ohnostrojUkazanRef.current) {
      ohnostrojUkazanRef.current = true;
      setZobrazOhnostroj(true);
    }
  }, [vsechnoHotove]);

  const harmonogram = useMemo(() => spocitejHarmonogram(
    zapasy,
    hra.pocet_kurtu,
    hra.settings?.cas_od,
    scoringTyp,
    scoringLimit,
    scoringLimitPlayoff,
  ), [zapasy, hra.pocet_kurtu, hra.settings?.cas_od, scoringTyp, scoringLimit, scoringLimitPlayoff]);

  const harmonogramMap = useMemo(() => {
    const m: Record<string, HarmonogramZaznam> = {};
    harmonogram.forEach(h => { m[h.zapasId] = h; });
    return m;
  }, [harmonogram]);

  function jmenoTymu(id: string) {
    return tymy.find(t => t.id === id)?.nazev ?? "?";
  }

  function getScore(id: string) { return scoreMap[id] ?? { s1: "", s2: "" }; }

  function updateScore(id: string, field: "s1" | "s2", val: string, zapasFaze: string) {
    const lim = zapasFaze === "skupina" ? scoringLimit : scoringLimitPlayoff;
    if (val === "") {
      setScoreMap(prev => ({ ...prev, [id]: { ...getScore(id), [field]: "" } }));
      return;
    }
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return;
    if (scoringTyp === "body") {
      // Auto-dopocet druhe strany — soucet = limit
      const capped = Math.min(n, lim);
      const other = String(lim - capped);
      setScoreMap(prev => ({
        ...prev,
        [id]: field === "s1" ? { s1: String(capped), s2: other } : { s1: other, s2: String(capped) },
      }));
      return;
    }
    if (scoringTyp === "gamy") {
      // Limit na max = lim, oba musi byt <= lim
      const capped = Math.min(n, lim);
      setScoreMap(prev => ({ ...prev, [id]: { ...getScore(id), [field]: String(capped) } }));
      return;
    }
    // cas — jakekoliv kladne cislo
    setScoreMap(prev => ({ ...prev, [id]: { ...getScore(id), [field]: String(n) } }));
  }

  async function ulozSkore(zapasId: string) {
    const sc = getScore(zapasId);
    const s1 = parseInt(sc.s1), s2 = parseInt(sc.s2);
    if (isNaN(s1) || isNaN(s2)) return;
    setUkladam(zapasId);
    const nyni = new Date();
    const hh = String(nyni.getHours()).padStart(2, "0");
    const mm = String(nyni.getMinutes()).padStart(2, "0");
    const vitez = s1 > s2 ? zapasy.find(z => z.id === zapasId)?.tym1_id : s2 > s1 ? zapasy.find(z => z.id === zapasId)?.tym2_id : null;
    await supabase.from("turnaj_zapasy").update({
      skore_tym1: s1,
      skore_tym2: s2,
      stav: "ukonceno",
      cas_konec: `${hh}:${mm}`,
      vitez_id: vitez ?? null,
    }).eq("id", zapasId);
    setUpravitId(null);
    nactiTurnaj();
    setUkladam(null);
  }

  // Pro Cas format: kurt uz je v harmonogramu, spust se primo
  // Pro Gamy/Body: otevre modal pro vyber kurtu
  async function spustitZapasNaKurtu(zapasId: string, kurt: number) {
    const nyni = new Date();
    const hh = String(nyni.getHours()).padStart(2, "0");
    const mm = String(nyni.getMinutes()).padStart(2, "0");
    await supabase.from("turnaj_zapasy").update({
      stav: "probiha",
      kurt,
      cas_zacatek: `${hh}:${mm}`,
    }).eq("id", zapasId);
    setKurtModal(null);
    nactiTurnaj();
  }

  function spustitZapas(zapasId: string) {
    if (scoringTyp === "cas") {
      // Cas format: pouzij kurt z harmonogramu
      const h = harmonogramMap[zapasId];
      if (h) {
        spustitZapasNaKurtu(zapasId, h.kurt);
      } else {
        // Fallback — otevri modal
        setKurtModal(zapasId);
      }
    } else {
      // Gamy / Body: vyber kurt rucne
      setKurtModal(zapasId);
    }
  }

  async function ulozInfo() {
    setUkladamInfo(true);
    const noveSettings = {
      ...(hra.settings ?? {}),
      popis: popis.trim(),
      pravidla: pravidla.trim(),
      cas_od: editCasOd,
      cas_do: editCasDo,
    };
    await supabase.from("hry").update({
      nazev: editNazev.trim() || hra.nazev,
      pocet_kurtu: typeof editPocetKurtu === "number" ? editPocetKurtu : hra.pocet_kurtu,
      settings: noveSettings,
    }).eq("id", hra.id);
    setEditInfo(false);
    setUkladamInfo(false);
    window.location.reload();
  }

  async function provedZruseniTurnaje() {
    if (!zrusitDuvod.trim()) return;
    setZrusujem(true);
    const noveSettings = { ...(hra.settings ?? {}), zruseno: true, duvod_zruseni: zrusitDuvod.trim(), zruseno_at: new Date().toISOString() };
    await supabase.from("hry").update({ stav: "ukonceno", settings: noveSettings }).eq("id", hra.id);
    setZrusitModal(false);
    setZrusitDuvod("");
    setZrusujem(false);
    window.location.reload();
  }

  async function smazatTurnaj() {
    setMazem(true);
    // Smazat zavisle zaznamy v poradi dle FK constraints
    const e1 = await supabase.from("turnaj_zapasy").delete().eq("hra_id", hra.id);
    if (e1.error) { alert("Chyba pri mazani zapasu: " + e1.error.message); setMazem(false); return; }
    const e2 = await supabase.from("turnaj_tymy").delete().eq("hra_id", hra.id);
    if (e2.error) { alert("Chyba pri mazani tymu: " + e2.error.message); setMazem(false); return; }
    const e3 = await supabase.from("hra_ucastnici").delete().eq("hra_id", hra.id);
    if (e3.error) { alert("Chyba pri mazani ucastniku: " + e3.error.message); setMazem(false); return; }
    const e4 = await supabase.from("hry").delete().eq("id", hra.id);
    if (e4.error) { alert("Chyba pri mazani hry: " + e4.error.message); setMazem(false); return; }
    setMazem(false);
    router.push("/hry");
  }

  async function zrusitSpusteni(zapasId: string) {
    await supabase.from("turnaj_zapasy").update({ stav: "ceka", kurt: null, cas_zacatek: null }).eq("id", zapasId);
    nactiTurnaj();
  }

  async function vytvorPlayoff() {
    setGenerujiPlayoff(true);
    const noveZapasy = generujPlayoff(skupinyMap, zapasySkupin, typPlayoff, multiTier, hra.id);
    await supabase.from("turnaj_zapasy").insert(noveZapasy);
    nactiTurnaj();
    setAktivniTab("tabulky");
    setGenerujiPlayoff(false);
  }

  function renderZapas(z: TurnajZapas, limit: number) {
    const sc = getScore(z.id);
    const jeUpravovany = upravitId === z.id;
    const jeNezadany = z.skore_tym1 == null;
    const zobrazInputy = jeEditor && (jeNezadany || jeUpravovany);

    return (
      <div key={z.id} className="px-5 py-4">
        {jeNezadany && (
          <div className="flex items-center justify-between mb-2">
            {z.stav === "probiha" ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>Probiha</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>Planovany</span>
            )}
            {jeEditor && (
              z.stav === "probiha"
                ? <button onClick={() => zrusitSpusteni(z.id)} className="text-xs underline" style={{ color: "#9ca3af" }}>zrusit start</button>
                : <button onClick={() => spustitZapas(z.id)} className="text-xs underline" style={{ color: "#801A28" }}>Spustit zapas</button>
            )}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 text-right">
            <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>{jmenoTymu(z.tym1_id)}</p>
          </div>
          {zobrazInputy ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <input type="number" min={0} max={scoringTyp === "cas" ? undefined : limit} value={sc.s1}
                onChange={e => updateScore(z.id, "s1", e.target.value, z.faze)}
                placeholder="—"
                className="w-12 rounded-lg border-2 border-[#801A28] px-1 py-2 text-center text-sm font-bold focus:outline-none" />
              <span className="font-bold text-sm" style={{ color: "#9ca3af" }}>:</span>
              <input type="number" min={0} max={scoringTyp === "cas" ? undefined : limit} value={sc.s2}
                onChange={e => updateScore(z.id, "s2", e.target.value, z.faze)}
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
            <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>{jmenoTymu(z.tym2_id)}</p>
          </div>
          {jeEditor && z.skore_tym1 != null && !jeUpravovany && (
            <button onClick={() => { setUpravitId(z.id); setScoreMap(prev => ({ ...prev, [z.id]: { s1: String(z.skore_tym1), s2: String(z.skore_tym2) } })); }}
              className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
              style={{ color: "#801A28" }}>
              Upravit
            </button>
          )}
        </div>
        {zobrazInputy && (() => {
          const n1 = parseInt(sc.s1), n2 = parseInt(sc.s2);
          let platne = !isNaN(n1) && !isNaN(n2) && sc.s1 !== "" && sc.s2 !== "";
          let hint = "";
          if (platne && scoringTyp === "body" && n1 + n2 !== limit) { platne = false; hint = `Soucet musi byt ${limit}`; }
          if (platne && scoringTyp === "gamy" && Math.max(n1, n2) !== limit) { platne = false; hint = `Vitez musi mit ${limit} gamu`; }
          if (platne && scoringTyp === "gamy" && n1 === n2) { platne = false; hint = "Remiza v gamy neni mozna"; }
          if (platne && scoringTyp === "cas" && z.faze !== "skupina" && n1 === n2) { platne = false; hint = "V playoff musi byt vitez"; }
          return (
            <div className="mt-3 flex items-center justify-between gap-2">
              {hint && <span className="text-xs" style={{ color: "#801A28" }}>{hint}</span>}
              <div className="flex gap-2 ml-auto">
                {jeUpravovany && (
                  <button onClick={() => setUpravitId(null)}
                    className="rounded-lg px-3 py-2 text-xs font-medium border border-zinc-200 hover:bg-zinc-50">
                    Zrusit
                  </button>
                )}
                <button onClick={() => ulozSkore(z.id)} disabled={ukladam === z.id || !platne}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                  style={{ backgroundColor: "#801A28" }}>
                  {ukladam === z.id ? "..." : "Ulozit"}
                </button>
              </div>
            </div>
          );
        })()}
        {!zobrazInputy && (
          <p className="text-xs mt-1 text-right" style={{ color: "#9ca3af" }}>
            {scoringTyp === "gamy" ? `do ${limit} gamu` : scoringTyp === "cas" ? `${limit} minut` : `${limit} bodu`}
          </p>
        )}
      </div>
    );
  }

  if (loading) return <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center"><p className="text-sm" style={{ color: "#9ca3af" }}>Nacitam...</p></div>;

  return (
    <div className="flex flex-col gap-6">

      {zobrazOhnostroj && finalniPoradi.length > 0 && (
        <OhnostrojOverlay
          vitez={finalniPoradi[0]?.nazev ?? ""}
          poradi={finalniPoradi.map(t => ({ jmeno: t.nazev, body: t.skore }))}
          onDone={() => setZobrazOhnostroj(false)}
        />
      )}

      {/* Zruseny banner */}
      {jeZruseno && (
        <div className="rounded-2xl px-5 py-4 border" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: "#801A28" }}>Turnaj byl zrusen</p>
              <p className="text-xs" style={{ color: "#7f1d1d" }}>Duvod: {hra.settings?.duvod_zruseni}</p>
              {hra.settings?.zruseno_at && (
                <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                  {new Date(hra.settings.zruseno_at).toLocaleString("cs-CZ")}
                </p>
              )}
            </div>
            {jeEditor && (
              <button onClick={() => setSmazatModal(true)}
                className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium hover:bg-red-50"
                style={{ color: "#801A28" }}>
                Smazat trvale
              </button>
            )}
          </div>
        </div>
      )}

      {/* Vyber kurtu modal — pro gamy/body */}
      {kurtModal && (() => {
        const zapasModal = zapasy.find(z => z.id === kurtModal);
        if (!zapasModal) return null;
        const obsazeneKurty = new Set(zapasy.filter(z => z.stav === "probiha" && z.id !== kurtModal && z.kurt != null).map(z => z.kurt));
        const vsechnyKurty = Array.from({ length: hra.pocet_kurtu }, (_, i) => i + 1);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setKurtModal(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#0A0A0A" }}>Na kterem kurtu se hraje?</h3>
              <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                {jmenoTymu(zapasModal.tym1_id)} <span style={{ color: "#9ca3af" }}>vs</span> {jmenoTymu(zapasModal.tym2_id)}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {vsechnyKurty.map(k => {
                  const obsazeny = obsazeneKurty.has(k);
                  return (
                    <button key={k} onClick={() => !obsazeny && spustitZapasNaKurtu(zapasModal.id, k)} disabled={obsazeny}
                      className="rounded-xl py-3 text-sm font-semibold border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        borderColor: obsazeny ? "#e5e7eb" : "#801A28",
                        color: obsazeny ? "#9ca3af" : "#801A28",
                        backgroundColor: obsazeny ? "#f9fafb" : "#fff5f5",
                      }}>
                      Kurt {k}
                      {obsazeny && <span className="block text-xs font-normal mt-0.5">obsazeny</span>}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <button onClick={() => setKurtModal(null)}
                  className="rounded-lg px-4 py-2 text-sm font-medium border border-zinc-200" style={{ color: "#374151" }}>
                  Zrusit
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Smazat modal */}
      {smazatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => !mazem && setSmazatModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#801A28" }}>Trvale smazat turnaj?</h3>
            <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
              Vsechny tymy, zapasy a vysledky budou trvale odstraneny z databaze. Tato akce je <strong>nevratna</strong>.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSmazatModal(false)} disabled={mazem}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-zinc-200 hover:bg-zinc-50"
                style={{ color: "#374151" }}>
                Ponechat
              </button>
              <button onClick={smazatTurnaj} disabled={mazem}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: "#801A28" }}>
                {mazem ? "Mazu..." : "Ano, smazat trvale"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zruseni modal */}
      {zrusitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => !zrusujem && setZrusitModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#0A0A0A" }}>Opravdu zrusit turnaj?</h3>
            <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
              Vsechny zapasy zustanou v DB pro pripadne historicke ucely. Akce je nevratna — pokracovani nebude mozne.
            </p>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>Duvod zruseni *</label>
            <textarea
              value={zrusitDuvod}
              onChange={e => setZrusitDuvod(e.target.value)}
              placeholder="Napr. nedostatek hracu, zraneni, technicka zavada..."
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28] resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setZrusitModal(false)} disabled={zrusujem}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-zinc-200 hover:bg-zinc-50"
                style={{ color: "#374151" }}>
                Zachovat turnaj
              </button>
              <button onClick={provedZruseniTurnaje} disabled={zrusujem || !zrusitDuvod.trim()}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: "#801A28" }}>
                {zrusujem ? "Rusim..." : "Ano, zrusit turnaj"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info bar */}
      <section className="bg-white rounded-2xl border border-zinc-100 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: "#374151" }}>
          <span><strong>{tymy.length}</strong> tymu</span>
          <span style={{ color: "#d1d5db" }}>·</span>
          <span><strong>{skupinyNazvy.length}</strong> {skupinyNazvy.length === 1 ? "skupina" : skupinyNazvy.length < 5 ? "skupiny" : "skupin"}</span>
          <span style={{ color: "#d1d5db" }}>·</span>
          <span>{scoringTyp === "gamy" ? `do ${scoringLimit} gamu` : scoringTyp === "cas" ? `${scoringLimit} min/zapas` : `${scoringLimit} bodu/zapas`}</span>
          {playoff && <><span style={{ color: "#d1d5db" }}>·</span><span>playoff</span></>}
          {hra.settings?.cas_od && hra.settings?.cas_do && (
            <><span style={{ color: "#d1d5db" }}>·</span><span>{hra.settings.cas_od} – {hra.settings.cas_do}</span></>
          )}
        </div>
      </section>

      {/* Tab switcher — 6 tabu, horizontalne scrollovatelne */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 -mx-4 px-4 sm:mx-0 sm:px-0">
        {([
          { k: "info",         l: "Info" },
          { k: "rozlosovani",  l: "Rozlosovani" },
          { k: "poradi",       l: "Poradi zapasu" },
          { k: "tabulky",      l: "Tabulky" },
          { k: "scoreboard",   l: "Scoreboard" },
          { k: "hraci",        l: "Hraci" },
        ] as { k: Tab; l: string }[]).map(t => (
          <button key={t.k} onClick={() => setAktivniTab(t.k)}
            className="px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px"
            style={{ borderColor: aktivniTab === t.k ? "#801A28" : "transparent", color: aktivniTab === t.k ? "#801A28" : "#6b7280" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ===== INFO ===== */}
      {aktivniTab === "info" && (
        <section className="bg-white rounded-2xl border border-zinc-100 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>Informace o turnaji</h2>
            {jeEditor && !editInfo && !jeZruseno && (
              <button onClick={() => setEditInfo(true)} className="text-xs underline" style={{ color: "#801A28" }}>upravit</button>
            )}
          </div>
          {editInfo ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Nazev turnaje</label>
                <input type="text" value={editNazev} onChange={e => setEditNazev(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Cas od</label>
                  <input type="time" value={editCasOd} onChange={e => setEditCasOd(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Cas do</label>
                  <input type="time" value={editCasDo} onChange={e => setEditCasDo(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                </div>
                <div className="w-24">
                  <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Kurty</label>
                  <input type="number" min={1} max={20} value={editPocetKurtu}
                    onChange={e => { const n = parseInt(e.target.value); setEditPocetKurtu(isNaN(n) ? "" : n); }}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Popis turnaje</label>
                <textarea value={popis} onChange={e => setPopis(e.target.value)} rows={3}
                  placeholder="Napr. otevreny mix turnaj pro hrace 4+, prizes..."
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28] resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Pravidla</label>
                <textarea value={pravidla} onChange={e => setPravidla(e.target.value)} rows={3}
                  placeholder="Napr. tie-break v rozhodujicim gemu, lerne case..."
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28] resize-none" />
              </div>
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                Format a scoring zatim nelze menit po vytvoreni — pripravujeme v dalsi verzi.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => {
                  setEditInfo(false);
                  setPopis((hra.settings as { popis?: string })?.popis ?? "");
                  setPravidla((hra.settings as { pravidla?: string })?.pravidla ?? "");
                  setEditNazev(hra.nazev);
                  setEditCasOd(hra.settings?.cas_od ?? "");
                  setEditCasDo(hra.settings?.cas_do ?? "");
                  setEditPocetKurtu(hra.pocet_kurtu);
                }}
                  className="rounded-lg px-3 py-2 text-xs font-medium border border-zinc-200" style={{ color: "#374151" }}>Zrusit</button>
                <button onClick={ulozInfo} disabled={ukladamInfo}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#801A28" }}>
                  {ukladamInfo ? "Ukladam..." : "Ulozit"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 text-sm" style={{ color: "#374151" }}>
              {(hra.settings as { popis?: string })?.popis ? (
                <div><p className="text-xs font-semibold mb-1" style={{ color: "#9ca3af" }}>POPIS</p><p className="whitespace-pre-wrap">{(hra.settings as { popis?: string }).popis}</p></div>
              ) : <p className="text-xs italic" style={{ color: "#9ca3af" }}>Popis turnaje zatim nevyplnen.</p>}
              {(hra.settings as { pravidla?: string })?.pravidla && (
                <div><p className="text-xs font-semibold mb-1" style={{ color: "#9ca3af" }}>PRAVIDLA</p><p className="whitespace-pre-wrap">{(hra.settings as { pravidla?: string }).pravidla}</p></div>
              )}
            </div>
          )}

          {/* Meta info — vzdy viditelne */}
          <div className="border-t border-zinc-100 pt-4 grid grid-cols-2 gap-3 text-xs" style={{ color: "#6b7280" }}>
            <div><span style={{ color: "#9ca3af" }}>Format:</span> <strong>{scoringTyp === "gamy" ? `do ${scoringLimit} gamu` : scoringTyp === "cas" ? `${scoringLimit} minut` : `${scoringLimit} bodu`}</strong></div>
            <div><span style={{ color: "#9ca3af" }}>Pocet tymu:</span> <strong>{tymy.length}</strong></div>
            <div><span style={{ color: "#9ca3af" }}>Skupin:</span> <strong>{skupinyNazvy.length}</strong></div>
            <div><span style={{ color: "#9ca3af" }}>Playoff:</span> <strong>{playoff ? "ano" : "ne"}</strong></div>
            {hra.settings?.cas_od && hra.settings?.cas_do && (
              <div className="col-span-2"><span style={{ color: "#9ca3af" }}>Cas:</span> <strong>{hra.settings.cas_od} – {hra.settings.cas_do}</strong></div>
            )}
          </div>
        </section>
      )}

      {/* ===== ROZLOSOVANI ===== */}
      {aktivniTab === "rozlosovani" && (
        <div className="flex flex-col gap-4">
          {skupinyNazvy.map(sName => {
            const skupinaTymy = skupinyMap[sName] ?? [];
            const zapasyTeto = zapasySkupin.filter(z => z.skupina === sName);
            return (
              <section key={sName} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-zinc-100" style={{ backgroundColor: "#fafafa" }}>
                  <p className="text-sm font-semibold" style={{ color: "#801A28" }}>Skupina {sName}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{skupinaTymy.length} tymu · {(skupinaTymy.length * (skupinaTymy.length - 1)) / 2} zapasu</p>
                </div>
                <div className="divide-y divide-zinc-50">
                  {skupinaTymy.map((t, i) => (
                    <div key={t.id} className="px-5 py-2.5 flex items-center gap-3 text-sm">
                      <span className="w-5 shrink-0 text-xs" style={{ color: "#9ca3af" }}>{i + 1}.</span>
                      <span className="font-medium" style={{ color: "#0A0A0A" }}>{t.nazev}</span>
                    </div>
                  ))}
                </div>
                <details className="border-t border-zinc-50">
                  <summary className="px-5 py-2 text-xs cursor-pointer hover:bg-zinc-50" style={{ color: "#9ca3af" }}>
                    Zobrazit zapasy ({zapasyTeto.length})
                  </summary>
                  <div className="divide-y divide-zinc-50">
                    {zapasyTeto.map(z => {
                      const hotovo = z.skore_tym1 != null;
                      return (
                        <div key={z.id} className="px-5 py-2 flex items-center gap-2 text-xs">
                          <span className="flex-1 text-right" style={{ color: hotovo ? "#9ca3af" : "#374151" }}>{jmenoTymu(z.tym1_id)}</span>
                          <span style={{ color: "#d1d5db" }}>vs</span>
                          <span className="flex-1" style={{ color: hotovo ? "#9ca3af" : "#374151" }}>{jmenoTymu(z.tym2_id)}</span>
                          {hotovo ? (
                            <span className="text-xs font-bold shrink-0" style={{ color: "#6b7280" }}>{z.skore_tym1}:{z.skore_tym2}</span>
                          ) : z.stav === "probiha" ? (
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>
                              Kurt {z.kurt}
                            </span>
                          ) : jeEditor && !jeZruseno ? (
                            <button onClick={() => spustitZapas(z.id)}
                              className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold text-white"
                              style={{ backgroundColor: "#801A28" }}>
                              Spustit
                            </button>
                          ) : (
                            <span className="shrink-0 text-xs" style={{ color: "#9ca3af" }}>—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              </section>
            );
          })}
          {playoffExistuje && (
            <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100" style={{ backgroundColor: "#fafafa" }}>
                <p className="text-sm font-semibold" style={{ color: "#801A28" }}>Playoff</p>
                <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                  {typPlayoff === "krizovy" ? "Krizovy pavouk" : "Primy pavouk"}{multiTier ? " · vice pasem" : ""}
                </p>
              </div>
              <div className="divide-y divide-zinc-50">
                {zapasyPlayoff.map(z => (
                  <div key={z.id} className="px-5 py-2 flex items-center gap-2 text-xs" style={{ color: "#6b7280" }}>
                    <span className="text-xs uppercase mr-2" style={{ color: "#9ca3af" }}>{z.faze === "playoff" ? "Finale" : z.faze.replace("playoff_pas_", "Pas ")}</span>
                    <span className="flex-1 text-right">{jmenoTymu(z.tym1_id)}</span>
                    <span style={{ color: "#d1d5db" }}>vs</span>
                    <span className="flex-1">{jmenoTymu(z.tym2_id)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ===== PORADI ZAPASU ===== */}
      {aktivniTab === "poradi" && (() => {
        // CAS format: synchronizovana kola po kurtech s fixnimi casy
        if (scoringTyp === "cas") {
          const kurty = [...new Set(harmonogram.map(h => h.kurt))].sort((a, b) => a - b);
          return (
            <div className="flex flex-col gap-4">
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                Synchronizovana kola — vsechny kurty zacinaji a konci spolu. Cas kola: <strong>{scoringLimit} min</strong>.
              </p>
              {kurty.map(kurt => {
                const zapasyKurtu = harmonogram.filter(h => h.kurt === kurt).sort((a, b) => a.casStartMin - b.casStartMin);
                return (
                  <section key={kurt} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-100" style={{ backgroundColor: "#fafafa" }}>
                      <p className="text-sm font-semibold" style={{ color: "#801A28" }}>Kurt {kurt}</p>
                    </div>
                    <div className="divide-y divide-zinc-50">
                      {zapasyKurtu.map(h => {
                        const z = zapasy.find(zz => zz.id === h.zapasId);
                        if (!z) return null;
                        const hotovo = z.skore_tym1 != null;
                        const skupinaLabel = z.skupina ? `Skupina ${z.skupina}` : z.faze === "playoff" ? "Finale" : z.faze.replace("playoff_pas_", "Pas ");
                        return (
                          <div key={h.zapasId} className="px-5 py-3 flex items-center gap-3">
                            <div className="shrink-0 text-right w-12">
                              <p className="text-xs font-bold tabular-nums" style={{ color: hotovo ? "#9ca3af" : "#0A0A0A" }}>{casMinToStr(h.casStartMin)}</p>
                              <p className="text-xs" style={{ color: "#d1d5db" }}>{casMinToStr(h.casEndMin)}</p>
                            </div>
                            <div className="w-px self-stretch" style={{ backgroundColor: hotovo ? "#e5e7eb" : "#801A28", opacity: 0.4 }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs mb-0.5" style={{ color: "#9ca3af" }}>{skupinaLabel}</p>
                              <p className="text-sm font-semibold truncate" style={{ color: hotovo ? "#9ca3af" : "#0A0A0A" }}>
                                {jmenoTymu(z.tym1_id)} <span style={{ color: "#d1d5db" }}>vs</span> {jmenoTymu(z.tym2_id)}
                              </p>
                            </div>
                            <div className="shrink-0 text-right flex items-center gap-2">
                              {hotovo ? (
                                <span className="text-sm font-bold" style={{ color: "#6b7280" }}>{z.skore_tym1} : {z.skore_tym2}</span>
                              ) : z.stav === "probiha" ? (
                                <>
                                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>Probiha</span>
                                  {jeEditor && <button onClick={() => zrusitSpusteni(z.id)} className="text-xs underline" style={{ color: "#9ca3af" }}>x</button>}
                                </>
                              ) : (
                                <>
                                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>Planovany</span>
                                  {jeEditor && !jeZruseno && (
                                    <button onClick={() => spustitZapas(z.id)}
                                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                                      style={{ backgroundColor: "#801A28" }}>
                                      Spustit
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          );
        }

        // GAMY / BODY format: fronta bez fixnich casu, kurt se prizadi rucne pri Spustit
        const skupinyZapasy = zapasySkupin.slice().sort((a, b) => {
          const sa = a.skupina ?? "", sb = b.skupina ?? "";
          if (sa !== sb) return sa.localeCompare(sb);
          return (a.created_at ?? "").localeCompare(b.created_at ?? "");
        });
        const playoffZapasy = zapasyPlayoff.slice().sort((a, b) => (a.faze ?? "").localeCompare(b.faze ?? ""));
        const fronta = [...skupinyZapasy, ...playoffZapasy];

        return (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: "#F2EDE4" }}>
              <p className="text-xs" style={{ color: "#374151" }}>
                <strong>Fronta zapasu</strong> — kazdy zapas spustis kliknutim na <em>Spustit</em>, vyberes kurt a zacne se hrat.
                <br/><span style={{ color: "#9ca3af" }}>Gamy a body neumi predikovat cas — 6:0 trva 10 min, 7:6 v tiebreaku i 30 min.</span>
              </p>
            </div>
            <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100" style={{ backgroundColor: "#fafafa" }}>
                <p className="text-sm font-semibold" style={{ color: "#801A28" }}>Fronta zapasu ({fronta.length})</p>
              </div>
              <div className="divide-y divide-zinc-50">
                {fronta.map((z, idx) => {
                  const hotovo = z.skore_tym1 != null;
                  const skupinaLabel = z.skupina ? `Skupina ${z.skupina}` : z.faze === "playoff" ? "Finale" : z.faze.replace("playoff_pas_", "Pas ");
                  return (
                    <div key={z.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="shrink-0 w-10 text-center">
                        <p className="text-xs font-bold" style={{ color: hotovo ? "#9ca3af" : "#0A0A0A" }}>#{idx + 1}</p>
                        {z.kurt && (z.stav === "probiha" || hotovo) && (
                          <p className="text-xs mt-0.5" style={{ color: "#801A28" }}>Kurt {z.kurt}</p>
                        )}
                      </div>
                      <div className="w-px self-stretch" style={{ backgroundColor: hotovo ? "#e5e7eb" : "#801A28", opacity: 0.4 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs mb-0.5" style={{ color: "#9ca3af" }}>{skupinaLabel}</p>
                        <p className="text-sm font-semibold truncate" style={{ color: hotovo ? "#9ca3af" : "#0A0A0A" }}>
                          {jmenoTymu(z.tym1_id)} <span style={{ color: "#d1d5db" }}>vs</span> {jmenoTymu(z.tym2_id)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right flex items-center gap-2">
                        {hotovo ? (
                          <span className="text-sm font-bold" style={{ color: "#6b7280" }}>{z.skore_tym1} : {z.skore_tym2}</span>
                        ) : z.stav === "probiha" ? (
                          <>
                            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>Probiha</span>
                            {jeEditor && <button onClick={() => zrusitSpusteni(z.id)} className="text-xs underline" style={{ color: "#9ca3af" }}>x</button>}
                          </>
                        ) : (
                          <>
                            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>Ve fronte</span>
                            {jeEditor && !jeZruseno && (
                              <button onClick={() => spustitZapas(z.id)}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                                style={{ backgroundColor: "#801A28" }}>
                                Spustit
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        );
      })()}

      {/* ===== TABULKY ===== */}
      {aktivniTab === "tabulky" && (
        <div className="flex flex-col gap-4">
          {/* Filtr + search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={filtrSkupiny} onChange={e => setFiltrSkupiny(e.target.value)}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]"
              style={{ color: "#374151" }}>
              <option value="vse">Vsechny skupiny</option>
              {skupinyNazvy.map(s => <option key={s} value={s}>Skupina {s}</option>)}
            </select>
            <input type="text" value={hledat} onChange={e => setHledat(e.target.value)}
              placeholder="Hledat tym podle nazvu..."
              className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
          </div>

          {skupinyNazvy.filter(s => filtrSkupiny === "vse" || filtrSkupiny === s).map(sName => {
            const tymySkupiny = (skupinyMap[sName] ?? []).filter(t => !hledat || t.nazev.toLowerCase().includes(hledat.toLowerCase()));
            const zapasyTeto = zapasySkupin.filter(z => z.skupina === sName);
            const tabulka = skupinaTabulka(tymySkupiny.length > 0 ? skupinyMap[sName] : [], zapasyTeto);
            const filtrovanaTabulka = tabulka.filter(t => !hledat || t.nazev.toLowerCase().includes(hledat.toLowerCase()));
            if (filtrovanaTabulka.length === 0 && hledat) return null;
            return (
              <div key={sName} className="flex flex-col gap-3">
                <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100">
                    <h2 className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>Skupina {sName}</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[400px]">
                      <thead>
                        <tr style={{ backgroundColor: "#fafafa" }}>
                          <th className="text-left pl-5 pr-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>#</th>
                          <th className="text-left px-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>Tym</th>
                          <th className="text-center px-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>V</th>
                          <th className="text-center px-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>R</th>
                          <th className="text-center px-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>P</th>
                          <th className="text-center px-2 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>Skore</th>
                          <th className="text-center px-2 pr-5 py-2 font-medium text-xs" style={{ color: "#9ca3af" }}>+/-</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtrovanaTabulka.map((t, i) => (
                          <tr key={t.id} className="border-t border-zinc-50">
                            <td className="pl-5 pr-2 py-3 font-bold text-xs" style={{ color: i < 2 ? "#801A28" : "#9ca3af" }}>{i + 1}</td>
                            <td className="px-2 py-3 font-semibold text-sm" style={{ color: "#0A0A0A" }}>{t.nazev}</td>
                            <td className="px-2 py-3 text-center text-xs font-medium" style={{ color: "#16a34a" }}>{t.vyhry}</td>
                            <td className="px-2 py-3 text-center text-xs font-medium" style={{ color: "#6b7280" }}>{t.remisy}</td>
                            <td className="px-2 py-3 text-center text-xs font-medium" style={{ color: "#dc2626" }}>{t.prohry}</td>
                            <td className="px-2 py-3 text-center text-xs font-bold" style={{ color: "#801A28" }}>{t.skore}</td>
                            <td className="px-2 pr-5 py-3 text-center text-xs font-semibold" style={{ color: t.rozdil >= 0 ? "#16a34a" : "#dc2626" }}>
                              {t.rozdil >= 0 ? "+" : ""}{t.rozdil}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                {!hledat && (
                  <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100">
                      <p className="text-xs font-medium" style={{ color: "#6b7280" }}>Zapasy — skupina {sName}</p>
                    </div>
                    <div className="divide-y divide-zinc-50">
                      {zapasyTeto.map(z => renderZapas(z, scoringLimit))}
                    </div>
                  </section>
                )}
              </div>
            );
          })}

          {/* Generovat playoff */}
          {jeEditor && playoff && vsechnySkupinyHotove && !playoffExistuje && !jeZruseno && (
            <button onClick={vytvorPlayoff} disabled={generujiPlayoff}
              className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "#801A28" }}>
              {generujiPlayoff ? "Generuji playoff..." : "Zahajit playoff"}
            </button>
          )}

          {/* Playoff bracket */}
          {playoffExistuje && (
            <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>Playoff</h2>
              </div>
              {(() => {
                const faze = [...new Set(zapasyPlayoff.map(z => z.faze))].sort();
                return faze.map(f => (
                  <div key={f}>
                    {faze.length > 1 && (
                      <div className="px-5 py-2 border-b border-zinc-50" style={{ backgroundColor: "#fafafa" }}>
                        <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>
                          {f === "playoff" ? "Finale" : f.replace("playoff_pas_", "Pas ")}
                        </p>
                      </div>
                    )}
                    <div className="divide-y divide-zinc-50">
                      {zapasyPlayoff.filter(z => z.faze === f).map(z => renderZapas(z, scoringLimitPlayoff))}
                    </div>
                  </div>
                ));
              })()}
            </section>
          )}

          {/* Vyhodnotit + konecne poradi */}
          {vsechnoHotove && (
            <>
              <button onClick={() => setZobrazOhnostroj(true)}
                className="w-full rounded-full py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: "#801A28" }}>
                Vyhodnotit — zobrazit viteze
              </button>
              {finalniPoradi.length > 0 && (
                <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100">
                    <h2 className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>Konecne poradi</h2>
                  </div>
                  <div className="divide-y divide-zinc-50">
                    {finalniPoradi.map((t, i) => (
                      <div key={t.nazev} className="px-5 py-3 flex items-center gap-3">
                        <span className="text-sm font-bold w-6 text-right shrink-0" style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : i === 2 ? "#cd7c32" : "#d1d5db" }}>{i + 1}.</span>
                        <span className="flex-1 font-semibold text-sm" style={{ color: "#0A0A0A" }}>{t.nazev}</span>
                        <span className="text-sm font-bold shrink-0" style={{ color: i === 0 ? "#801A28" : "#6b7280" }}>{t.skore} b</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== SCOREBOARD ===== */}
      {aktivniTab === "scoreboard" && (() => {
        const odehrane = zapasy.filter(z => z.skore_tym1 != null).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
        if (odehrane.length === 0) {
          return (
            <section className="bg-white rounded-2xl border border-zinc-100 p-8 text-center">
              <p className="text-sm" style={{ color: "#9ca3af" }}>Zatim zadne odehrane zapasy.</p>
            </section>
          );
        }
        return (
          <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>Odehrane zapasy</h2>
              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{odehrane.length} zapasu · od nejnovejsiho</p>
            </div>
            <div className="divide-y divide-zinc-50">
              {odehrane.map(z => {
                const s1 = z.skore_tym1!, s2 = z.skore_tym2!;
                const vitez = s1 > s2 ? z.tym1_id : s2 > s1 ? z.tym2_id : null;
                const skupinaLabel = z.skupina ? `Skupina ${z.skupina}` : z.faze === "playoff" ? "Finale" : z.faze.replace("playoff_pas_", "Pas ");
                return (
                  <div key={z.id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium" style={{ color: "#9ca3af" }}>{skupinaLabel}</p>
                      {z.kurt && <p className="text-xs" style={{ color: "#9ca3af" }}>Kurt {z.kurt}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="flex-1 text-right text-sm" style={{ color: vitez === z.tym1_id ? "#801A28" : "#6b7280", fontWeight: vitez === z.tym1_id ? 700 : 500 }}>
                        {jmenoTymu(z.tym1_id)}
                      </p>
                      <p className="shrink-0 text-base font-bold tabular-nums" style={{ color: "#0A0A0A" }}>{s1} : {s2}</p>
                      <p className="flex-1 text-sm" style={{ color: vitez === z.tym2_id ? "#801A28" : "#6b7280", fontWeight: vitez === z.tym2_id ? 700 : 500 }}>
                        {jmenoTymu(z.tym2_id)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* ===== HRACI ===== */}
      {aktivniTab === "hraci" && (() => {
        const filtrovaneTymy = tymy.filter(t => !hledat || t.nazev.toLowerCase().includes(hledat.toLowerCase())
          || (t.hrac1_id && hraciDB.find(h => h.id === t.hrac1_id)?.jmeno.toLowerCase().includes(hledat.toLowerCase()))
          || (t.hrac2_id && hraciDB.find(h => h.id === t.hrac2_id)?.jmeno.toLowerCase().includes(hledat.toLowerCase()))
        );
        return (
          <div className="flex flex-col gap-3">
            <input type="text" value={hledat} onChange={e => setHledat(e.target.value)}
              placeholder="Hledat tym nebo hrace..."
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
            <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>Tymy a hraci</h2>
                <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{filtrovaneTymy.length} tymu</p>
              </div>
              <div className="divide-y divide-zinc-50">
                {filtrovaneTymy.map(t => {
                  const h1 = t.hrac1_id ? hraciDB.find(h => h.id === t.hrac1_id) : null;
                  const h2 = t.hrac2_id ? hraciDB.find(h => h.id === t.hrac2_id) : null;
                  return (
                    <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                      <span className="text-xs font-bold w-5 shrink-0" style={{ color: "#9ca3af" }}>{t.skupina}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>{t.nazev}</p>
                        {(h1 || h2) ? (
                          <p className="text-xs" style={{ color: "#6b7280" }}>
                            {h1?.jmeno ?? "—"}{h2 ? ` · ${h2.jmeno}` : ""}
                          </p>
                        ) : (
                          <p className="text-xs italic" style={{ color: "#9ca3af" }}>Bez prirazenych hracu</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {jeEditor && !jeZruseno && (
                <div className="px-5 py-3 border-t border-zinc-100" style={{ backgroundColor: "#fafafa" }}>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    Editor hracu — moznost doplnit jmena k tymum bez prirazeni — bude doplneno v dalsi verzi.
                  </p>
                </div>
              )}
            </section>
          </div>
        );
      })()}

      {/* Zrusit turnaj — pouze pro editora a pokud neni jiz zruseny */}
      {jeEditor && !jeZruseno && (
        <div className="pt-4 border-t border-zinc-200">
          <button onClick={() => setZrusitModal(true)}
            className="text-xs underline hover:no-underline"
            style={{ color: "#9ca3af" }}>
            Zrusit turnaj
          </button>
        </div>
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
                  {hra.typ === "americano" ? ` · ${hra.body_na_zapas} bodu` : ""}
                  {hra.typ === "turnaj" && hra.settings?.scoring_typ
                    ? ` · ${hra.settings.scoring_typ === "gamy" ? `do ${hra.settings.scoring_limit} gamu` : hra.settings.scoring_typ === "cas" ? `${hra.settings.scoring_limit} min/kolo` : `${hra.settings.scoring_limit} bodu`}`
                    : ""}
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
            <TurnajView hra={hra} jeEditor={jeEditor} />
          )}

        </div>
      </main>
    </div>
  );
}
