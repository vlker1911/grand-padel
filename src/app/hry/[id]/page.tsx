"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { spocitejTabulku } from "@/lib/americano";
import { smazatHru as smazatHruDb, nactiPoctyMazani, type HraTyp } from "@/lib/hry";
import {
  generujRozvrh, dosadDoRozvrhu, zapasy2Faze,
  type TurnajFormat, type TymVeSkupine,
} from "@/lib/turnaj-format";
import { poradiSkupin, globalniNasazeni } from "@/lib/turnaj-postup";
import StartovneTab from "@/components/StartovneTab";

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
    playoff_mode?: "bez" | "medaile" | "vitez" | "umisteni";
    vitez_bracket?: "auto" | "top4" | "top8" | "top16";
    gamy_tiebreak?: "sudden_death" | "advantage";
  } | null;
};

type PlayoffMode = "bez" | "medaile" | "vitez" | "umisteni";

function odvozPlayoffMode(s: Hra["settings"]): PlayoffMode {
  if (s?.playoff_mode) return s.playoff_mode;
  if (s?.playoff === false) return "bez";
  if (s?.multi_tier === false) return "medaile";
  return "umisteni";
}

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
    if (val === "") {
      setScoreMap(prev => ({ ...prev, [id]: { ...getScore(id), [field]: "" } }));
      return;
    }
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return;  // ignoruj neplatne
    const capped = Math.min(n, limit);  // cap na limit
    const other = String(limit - capped);
    setScoreMap(prev => ({
      ...prev,
      [id]: field === "s1" ? { s1: String(capped), s2: other } : { s1: other, s2: String(capped) }
    }));
  }

  async function ulozSkore(zapasId: string) {
    const sc = getScore(zapasId);
    const s1 = parseInt(sc.s1), s2 = parseInt(sc.s2);
    if (isNaN(s1) || isNaN(s2)) return;
    if (s1 + s2 !== limit) return;  // validace: soucet musi byt limit
    if (s1 < 0 || s2 < 0 || s1 > limit || s2 > limit) return;
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

function MexicanoView({ hra, ucastnici, zapasy, jeEditor, nactiData }: {
  hra: Hra;
  ucastnici: Ucastnik[];
  zapasy: Zapas[];
  jeEditor: boolean;
  nactiData: () => void;
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

  // Kola — odvozeno ze zapasu (persistovane v DB)
  const supabaseMex = createClient();
  const [aktivniKolo, setAktivniKolo] = useState(1);

  function jmenoUcastnika(id: string | null | undefined): string {
    if (!id) return "?";
    return ucastnici.find(u => u.id === id)?.jmeno ?? "?";
  }

  function idUcastnika(jmeno: string): string | null {
    return ucastnici.find(u => u.jmeno === jmeno)?.id ?? null;
  }

  const kola = useMemo<MexKolo[]>(() => {
    // Mexicano zapasy nemaji "faze" konvenci — pouzivame default "skupiny"
    // Identifikujeme je tak, ze patri k mexicano hre (hra.typ === "mexicano")
    const mexZapasy = zapasy.filter(z => z.kolo > 0);
    const grouped: Record<number, Zapas[]> = {};
    for (const z of mexZapasy) {
      if (!grouped[z.kolo]) grouped[z.kolo] = [];
      grouped[z.kolo].push(z);
    }
    return Object.keys(grouped).map(Number).sort((a, b) => a - b).map(cislo => {
      const zs = grouped[cislo].slice().sort((a, b) => a.kurt - b.kurt);
      return {
        cislo,
        kurty: zs.map(z => ({
          kurt: z.kurt,
          tym1: [jmenoUcastnika(z.tym1_hrac1_id), jmenoUcastnika(z.tym1_hrac2_id)],
          tym2: [jmenoUcastnika(z.tym2_hrac1_id), jmenoUcastnika(z.tym2_hrac2_id)],
        })),
        vysledky: zs.map(z => ({
          kurt: z.kurt,
          vitez: z.skore_tym1 != null && z.skore_tym2 != null
            ? (z.skore_tym1 > z.skore_tym2 ? "tym1" : z.skore_tym2 > z.skore_tym1 ? "tym2" : null)
            : null,
        })),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zapasy, ucastnici]);

  // Inicializace kola 1 — pokud zatim neexistuji zadne zapasy, vygeneruj a uloz do DB
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    if (ucastnici.length === 0) return;
    if (zapasy.some(z => z.kolo > 0)) { initRef.current = true; return; }
    if (!jeEditor) return;  // jen editor inicializuje
    initRef.current = true;
    (async () => {
      const zamichani = [...ucastnici].sort(() => Math.random() - 0.5);
      const rows = cislaKurtu.map((kurt, i) => {
        const base = i * 4;
        return {
          hra_id: hra.id,
          kolo: 1,
          kurt,
          tym1_hrac1_id: zamichani[base]?.id ?? null,
          tym1_hrac2_id: zamichani[base + 1]?.id ?? null,
          tym2_hrac1_id: zamichani[base + 2]?.id ?? null,
          tym2_hrac2_id: zamichani[base + 3]?.id ?? null,
          stav: "ceka",
          faze: "skupiny",
        };
      });
      await supabaseMex.from("hra_zapasy").insert(rows);
      nactiData();
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ucastnici, zapasy]);

  // Nove kolo — formular state (NE persistovany, jen v UI)
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

  async function ulozNoveKolo() {
    const noveCislo = kola.length + 1;
    const rows = novePary.map(p => ({
      hra_id: hra.id,
      kolo: noveCislo,
      kurt: p.kurt,
      tym1_hrac1_id: idUcastnika(p.tym1[0]),
      tym1_hrac2_id: idUcastnika(p.tym1[1]),
      tym2_hrac1_id: idUcastnika(p.tym2[0]),
      tym2_hrac2_id: idUcastnika(p.tym2[1]),
      stav: "ceka",
      faze: "skupiny",
    }));
    await supabaseMex.from("hra_zapasy").insert(rows);
    setAktivniKolo(noveCislo);
    setPridavamKolo(false);
    setPohybInfo([]);
    nactiData();
  }

  async function zapisVysledek(kurtCislo: number, vitez: "tym1" | "tym2") {
    // Najdi zapas v DB pro toto kolo + kurt
    const z = zapasy.find(zz => zz.kolo === aktivniKolo && zz.kurt === kurtCislo);
    if (!z) return;
    const skore_tym1 = vitez === "tym1" ? 1 : 0;
    const skore_tym2 = vitez === "tym2" ? 1 : 0;
    await supabaseMex.from("hra_zapasy").update({
      skore_tym1, skore_tym2, stav: "ukonceno",
    }).eq("id", z.id);
    nactiData();
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

// Round-robin reorder: vrati zapasy v poradi takovem, aby v ramci skupiny se
// stridaly tymy v jednotlivych "kolech round-robinu" (circle method). To
// pomahacky greedy schedulleru naplnit kurty bez prostoju.
function reorderRoundRobin(zapasy: TurnajZapas[]): TurnajZapas[] {
  // Extrahuj unique tymy v poradi vyskytu
  const tymyIds: string[] = [];
  for (const z of zapasy) {
    if (!tymyIds.includes(z.tym1_id)) tymyIds.push(z.tym1_id);
    if (!tymyIds.includes(z.tym2_id)) tymyIds.push(z.tym2_id);
  }
  const n = tymyIds.length;
  if (n < 2) return zapasy;
  // Circle method: pridej BYE pokud lichy
  const teams = [...tymyIds];
  if (n % 2 === 1) teams.push("__BYE__");
  const m = teams.length;
  const orderedPairs: [string, string][] = [];
  const rotace = [...teams];
  for (let r = 0; r < m - 1; r++) {
    for (let i = 0; i < m / 2; i++) {
      const t1 = rotace[i];
      const t2 = rotace[m - 1 - i];
      if (t1 !== "__BYE__" && t2 !== "__BYE__") {
        orderedPairs.push([t1, t2]);
      }
    }
    // Rotace: zachovaj rotace[0], ostatni rotuj
    const last = rotace.pop()!;
    rotace.splice(1, 0, last);
  }
  // Pro kazdy pair najdi zapas
  const result: TurnajZapas[] = [];
  const used = new Set<string>();
  for (const [a, b] of orderedPairs) {
    const z = zapasy.find(zz =>
      !used.has(zz.id) &&
      ((zz.tym1_id === a && zz.tym2_id === b) || (zz.tym1_id === b && zz.tym2_id === a))
    );
    if (z) {
      result.push(z);
      used.add(z.id);
    }
  }
  // Pridej zbyle (kdyby nejaky zustal mimo schema)
  for (const z of zapasy) {
    if (!used.has(z.id)) result.push(z);
  }
  return result;
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

  // Skupiny — reorder per skupina dle round-robin (circle method) a interleave
  const skupinaZapasy = zapasy.filter(z => z.faze === "skupina");
  const skupinyMap: Record<string, TurnajZapas[]> = {};
  for (const z of skupinaZapasy) {
    const s = z.skupina ?? "_";
    if (!skupinyMap[s]) skupinyMap[s] = [];
    skupinyMap[s].push(z);
  }
  const skupinyNazvy = Object.keys(skupinyMap).sort();
  // Reorder per skupina
  const reordered: TurnajZapas[][] = skupinyNazvy.map(s => reorderRoundRobin(skupinyMap[s]));
  // Interleave: vezmi 1 zapas z kazde skupiny, pak dalsi, atd.
  const interleaved: TurnajZapas[] = [];
  const indexes = skupinyNazvy.map(() => 0);
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (let s = 0; s < skupinyNazvy.length; s++) {
      if (indexes[s] < reordered[s].length) {
        interleaved.push(reordered[s][indexes[s]]);
        indexes[s]++;
        progressed = true;
      }
    }
  }
  const serazene = [
    ...interleaved,
    ...zapasy.filter(z => z.faze !== "skupina"),
  ];

  const result: HarmonogramZaznam[] = [];
  const pending = [...serazene];
  let casNow = startMin;

  // Synchronizovana kola s kontrolou konfliktu tymu — tym hraje jen jednou v kole
  while (pending.length > 0) {
    const teamsThisRound = new Set<string>();
    const assignedThisRound: { z: TurnajZapas; kurt: number; delka: number }[] = [];
    let courtIdx = 0;
    let i = 0;
    while (courtIdx < pocetKurtu && i < pending.length) {
      const m = pending[i];
      if (!teamsThisRound.has(m.tym1_id) && !teamsThisRound.has(m.tym2_id)) {
        teamsThisRound.add(m.tym1_id);
        teamsThisRound.add(m.tym2_id);
        const delka = delkaZapasu(m);
        assignedThisRound.push({ z: m, kurt: courtIdx + 1, delka });
        pending.splice(i, 1);
        courtIdx++;
        // i stays at same position (we removed current)
      } else {
        i++;
      }
    }

    if (assignedThisRound.length === 0) {
      // Vsechny zbyle zapasy maji konflikt s teamsThisRound — pak by forever-loop.
      // Force: vezmi prvni zbyly zapas (vykonej, i kdyz technicky konflikt nelze)
      const m = pending.shift();
      if (!m) break;
      assignedThisRound.push({ z: m, kurt: 1, delka: delkaZapasu(m) });
    }

    const maxDelka = Math.max(...assignedThisRound.map(a => a.delka));
    for (const { z, kurt, delka } of assignedThisRound) {
      result.push({
        zapasId: z.id,
        kurt,
        casStartMin: casNow,
        casEndMin: casNow + delka,
      });
    }
    casNow += maxDelka + prechod;
  }

  return result;
}

// Vrati pekny label pro zobrazeni faze zapasu.
// Preferuje umisteni (engine ho nastavuje hezky), jinak fallback podle fáze.
function fazeLabelGlobal(z: TurnajZapas): string {
  if (z.umisteni) return z.umisteni;
  if (z.faze === "skupina") return `Skupina ${z.skupina ?? ""}${z.kolo ? ` - kolo ${z.kolo}` : ""}`;
  if (z.faze === "skupina_o_umisteni") return "Skupina o umístění";
  if (z.faze === "semifinale") return "Semifinále";
  if (z.faze === "finale") return "Finále";
  if (z.faze === "o_3_misto") return "O 3. místo";
  if (z.faze === "ctvrtfinale") return "Čtvrtfinále";
  if (z.faze === "utech_1") return "Útěchový pavouk — 1. kolo";
  if (z.faze === "utech_2") return "Útěchový pavouk";
  if (z.faze === "utech_finale") return "Útěchové finále";
  if (z.faze === "playoff") return "Playoff";
  return z.faze.replace("playoff_pas_", "Pásmo ");
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

// Pomoc: serad vsechny tymy podle skupin (vyhraje 1A, 1B, 1C, 2A, 2B, 2C, 3A...) — interleaved
function serazenePoSkupinach(skupiny: Record<string, TurnajTym[]>, zapasySkupin: TurnajZapas[]): TurnajTym[] {
  const skupNames = Object.keys(skupiny).sort();
  const poradi: Record<string, TurnajTym[]> = {};
  skupNames.forEach(s => {
    poradi[s] = skupinaTabulka(skupiny[s], zapasySkupin.filter(z => z.skupina === s));
  });
  const vsichni: TurnajTym[] = [];
  const maxPos = Math.max(...skupNames.map(s => poradi[s].length));
  for (let pos = 0; pos < maxPos; pos++) {
    skupNames.forEach(s => { if (poradi[s][pos]) vsichni.push(poradi[s][pos]); });
  }
  return vsichni;
}

function emptyZapas(hraId: string, faze: string, kolo: number, tym1: string, tym2: string, umisteni: string | null = null): Omit<TurnajZapas, "id"> {
  return {
    hra_id: hraId, faze, skupina: null, kolo,
    tym1_id: tym1, tym2_id: tym2,
    skore_tym1: null, skore_tym2: null,
    vitez_id: null, kurt: null, poradi_fronta: null,
    cas_zacatek: null, cas_konec: null,
    umisteni, stav: "ceka", created_at: null,
  };
}

function generujPlayoff(
  skupiny: Record<string, TurnajTym[]>,
  zapasySkupin: TurnajZapas[],
  playoffMode: PlayoffMode,
  hraId: string,
  vitezBracket: "auto" | "top4" | "top8" | "top16" = "auto",
): Omit<TurnajZapas, "id">[] {
  if (playoffMode === "bez") return [];

  const vsichni = serazenePoSkupinach(skupiny, zapasySkupin);
  const n = vsichni.length;

  if (playoffMode === "medaile") {
    // Final Four: top 4 tymy
    const top = vsichni.slice(0, 4);
    if (top.length < 2) return [];
    if (top.length === 2) {
      return [emptyZapas(hraId, "playoff", 1, top[0].id, top[1].id, "final")];
    }
    if (top.length === 3) {
      // 1 vs 2, vitez vs 3 — zjednoduseno: jen 1v2 jako "finale"
      return [emptyZapas(hraId, "playoff", 1, top[0].id, top[1].id, "final")];
    }
    // top.length === 4: 2 semi (krizove: 1v4, 2v3), pak finale + o3
    return [
      emptyZapas(hraId, "playoff", 1, top[0].id, top[3].id),
      emptyZapas(hraId, "playoff", 1, top[1].id, top[2].id),
    ];
  }

  if (playoffMode === "vitez") {
    // Single elimination: bracketSize podle volby
    let bracketSize: number;
    if (vitezBracket === "top4") bracketSize = 4;
    else if (vitezBracket === "top8") bracketSize = 8;
    else if (vitezBracket === "top16") bracketSize = 16;
    else {
      bracketSize = 2;
      while (bracketSize * 2 <= n && bracketSize < 16) bracketSize *= 2;
    }
    while (bracketSize > n && bracketSize > 2) bracketSize /= 2;
    const top = vsichni.slice(0, bracketSize);
    const zapasy: Omit<TurnajZapas, "id">[] = [];
    for (let i = 0; i < bracketSize / 2; i++) {
      zapasy.push(emptyZapas(hraId, "playoff", 1, top[i].id, top[bracketSize - 1 - i].id));
    }
    return zapasy;
  }

  // playoffMode === "umisteni" (multi-tier)
  const zapasy: Omit<TurnajZapas, "id">[] = [];
  const pocetPasem = Math.ceil(n / 4);
  for (let pas = 0; pas < pocetPasem; pas++) {
    const tymyPasma = vsichni.slice(pas * 4, (pas + 1) * 4);
    const faze = pas === 0 ? "playoff" : `playoff_pas_${pas + 1}`;
    if (tymyPasma.length === 4) {
      // 2 semi krizove: 1v4, 2v3
      zapasy.push(emptyZapas(hraId, faze, 1, tymyPasma[0].id, tymyPasma[3].id));
      zapasy.push(emptyZapas(hraId, faze, 1, tymyPasma[1].id, tymyPasma[2].id));
    } else if (tymyPasma.length === 3) {
      // Jen 1 zapas: 1 vs 2 (3. tym ma BYE)
      zapasy.push(emptyZapas(hraId, faze, 1, tymyPasma[0].id, tymyPasma[1].id, "final"));
    } else if (tymyPasma.length === 2) {
      zapasy.push(emptyZapas(hraId, faze, 1, tymyPasma[0].id, tymyPasma[1].id, "final"));
    }
  }
  return zapasy;
}

const SKUPINY_NAZVY_LOCAL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function TurnajView({ hra, jeEditor, onSmazatRequest }: { hra: Hra; jeEditor: boolean; onSmazatRequest: () => void }) {
  const supabase = createClient();
  const settings = (hra.settings ?? {}) as TurnajSettings;
  const scoringTyp = settings.scoring_typ ?? "gamy";
  const scoringLimit = settings.scoring_limit ?? 4;
  const scoringLimitPlayoff = settings.scoring_limit_playoff ?? scoringLimit;
  const playoffMode = odvozPlayoffMode(hra.settings);
  const playoff = playoffMode !== "bez";
  const typPlayoff = settings.typ_playoff ?? "krizovy";
  const multiTier = playoffMode === "umisteni";

  const [tymy, setTymy] = useState<TurnajTym[]>([]);
  const [zapasy, setZapasy] = useState<TurnajZapas[]>([]);
  const [hraciDB, setHraciDB] = useState<Ucastnik[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreMap, setScoreMap] = useState<Record<string, { s1: string; s2: string }>>({});
  const [ukladam, setUkladam] = useState<string | null>(null);
  const [upravitId, setUpravitId] = useState<string | null>(null);
  const [generujiPlayoff, setGenerujiPlayoff] = useState(false);
  type Tab = "info" | "rozlosovani" | "poradi" | "tabulky" | "scoreboard" | "hraci" | "startovne";
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
  const [kurtModal, setKurtModal] = useState<string | null>(null);
  const [kurtDropdownPro, setKurtDropdownPro] = useState<string | null>(null);
  const [editHraciTymId, setEditHraciTymId] = useState<string | null>(null);
  const [editHrac1, setEditHrac1] = useState("");
  const [editHrac2, setEditHrac2] = useState("");
  const [ukladamHrace, setUkladamHrace] = useState(false);

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

  // Auto-aktualizace 2. fáze v DB:
  //   - po dohrání skupin se vloží 1. kolo playoff (semi, mini-bracketové
  //     finále pro malá pásma, skupiny_o_umisteni round-robin).
  //   - po dohrání semi se vloží finále + o 3. místo s reálnými ID.
  //   - po dohrání čtvrtfinále se vloží semifinále, atd.
  // Funkce aktualizujDruhouFazi je idempotentní (dedup) — bezpečně se volá vícekrát.
  // Spouštíme když se změní (a) počet zápasů (přibyl nový kolo), nebo
  // (b) počet dohraných zápasů (uložilo se skóre — možná je čas
  // doplnit další kolo).
  const pocetDohranych = useMemo(
    () => zapasy.filter(z => z.skore_tym1 != null).length,
    [zapasy],
  );
  const posledniTrigger = useRef("");
  useEffect(() => {
    if (jeZruseno || !jeEditor) return;
    if (!playoff) return;
    if (!vsechnySkupinyHotove) return;
    if (generujiPlayoff) return;
    const trig = `${zapasy.length}|${pocetDohranych}`;
    if (posledniTrigger.current === trig) return;
    posledniTrigger.current = trig;
    aktualizujDruhouFazi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vsechnySkupinyHotove, zapasy.length, pocetDohranych, jeZruseno, jeEditor, playoff, generujiPlayoff]);

  const vsechnoHotove = useMemo(
    () => (!playoff && vsechnySkupinyHotove) || (playoff && vsechnyPlayoffHotove),
    [playoff, vsechnySkupinyHotove, vsechnyPlayoffHotove]
  );

  // Finalni poradi: vitezove pasem playoff (nebo skupin pokud bez playoff)
  // Pro kazde pasmo (faze): finale -> 1. a 2. misto, o3misto -> 3. a 4. misto
  // Pro vitez s vyssim bracketem (top8, top16) je finale v kole 3, 4...
  const finalniPoradi = useMemo((): { nazev: string; skore: number }[] => {
    if (!vsechnoHotove) return [];
    if (playoff && playoffExistuje) {
      const result: { nazev: string; skore: number }[] = [];
      const fazePoradi = [...new Set(zapasyPlayoff.map(z => z.faze))].sort();
      fazePoradi.forEach(faze => {
        // Najdi zapas s umisteni="final" v jakemkoliv kole (pro vitez muze byt v kolo 2, 3 nebo 4)
        const finale = zapasyPlayoff.find(z => z.faze === faze && z.umisteni === "final");
        const o3 = zapasyPlayoff.find(z => z.faze === faze && z.umisteni === "o3misto");
        if (finale && finale.skore_tym1 != null && finale.skore_tym2 != null) {
          const s1 = finale.skore_tym1, s2 = finale.skore_tym2;
          const winnerId = s1 > s2 ? finale.tym1_id : finale.tym2_id;
          const loserId = s1 > s2 ? finale.tym2_id : finale.tym1_id;
          result.push({ nazev: jmenoTymu(winnerId), skore: Math.max(s1, s2) });
          result.push({ nazev: jmenoTymu(loserId),  skore: Math.min(s1, s2) });
        }
        if (o3 && o3.skore_tym1 != null && o3.skore_tym2 != null) {
          const s1 = o3.skore_tym1, s2 = o3.skore_tym2;
          const winnerId = s1 > s2 ? o3.tym1_id : o3.tym2_id;
          const loserId = s1 > s2 ? o3.tym2_id : o3.tym1_id;
          result.push({ nazev: jmenoTymu(winnerId), skore: Math.max(s1, s2) });
          result.push({ nazev: jmenoTymu(loserId),  skore: Math.min(s1, s2) });
        }
      });
      return result;
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
      // Nastav hra.stav na "ukonceno" pokud jeste neni
      if (hra.stav !== "ukonceno") {
        supabase.from("hry").update({ stav: "ukonceno" }).eq("id", hra.id).then(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Advantage tiebreak povoluje vitez=limit+1, sudden_death=limit max
      const tb = hra.settings?.gamy_tiebreak ?? "sudden_death";
      const maxAllowed = tb === "advantage" ? lim + 1 : lim;
      const capped = Math.min(n, maxAllowed);
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
    const zapas = zapasy.find(z => z.id === zapasId);
    if (!zapas) return;
    // Validace dle scoringTyp — guard i pro programaticka volani
    const lim = zapas.faze === "skupina" ? scoringLimit : scoringLimitPlayoff;
    if (scoringTyp === "body" && s1 + s2 !== lim) return;
    if (scoringTyp === "gamy") {
      const w = Math.max(s1, s2), l = Math.min(s1, s2);
      const tb = hra.settings?.gamy_tiebreak ?? "sudden_death";
      if (tb === "sudden_death") {
        if (w !== lim || l > lim - 1 || s1 === s2) return;
      } else {
        const normalWin = w === lim && l <= lim - 2;
        const winByTwo = w === lim + 1 && l === lim - 1;
        const tiebreakWin = w === lim + 1 && l === lim;
        if (!normalWin && !winByTwo && !tiebreakWin) return;
      }
    }
    if (scoringTyp === "cas" && zapas.faze !== "skupina" && s1 === s2) return;
    setUkladam(zapasId);
    const nyni = new Date();
    const hh = String(nyni.getHours()).padStart(2, "0");
    const mm = String(nyni.getMinutes()).padStart(2, "0");
    const vitez = s1 > s2 ? zapas?.tym1_id : s2 > s1 ? zapas?.tym2_id : null;
    await supabase.from("turnaj_zapasy").update({
      skore_tym1: s1,
      skore_tym2: s2,
      stav: "ukonceno",
      cas_konec: `${hh}:${mm}`,
      vitez_id: vitez ?? null,
    }).eq("id", zapasId);

    // Auto-generuj dalsi kolo playoff dle modu
    if (zapas && zapas.faze.startsWith("playoff")) {
      const aktualniKoloZapasy = zapasy
        .filter(z => z.faze === zapas.faze && z.kolo === zapas.kolo);
      const ostatniHotove = aktualniKoloZapasy
        .filter(z => z.id !== zapasId)
        .filter(z => z.skore_tym1 != null);
      const vsechnyHotove = ostatniHotove.length + 1 === aktualniKoloZapasy.length;

      if (vsechnyHotove) {
        // Sestav seznam vsech zapasu kola s aktualizovanym skore tohoto
        const kolo = aktualniKoloZapasy.map(z =>
          z.id === zapasId ? { ...z, skore_tym1: s1, skore_tym2: s2, vitez_id: vitez ?? null } : z
        );

        if (playoffMode === "vitez") {
          // Single elim: vitezove postupuji do dalsiho kola
          if (kolo.length >= 2) {
            const noveZapasy = [];
            for (let i = 0; i + 1 < kolo.length; i += 2) {
              const w1 = kolo[i].vitez_id ?? (kolo[i].skore_tym1! >= kolo[i].skore_tym2! ? kolo[i].tym1_id : kolo[i].tym2_id);
              const w2 = kolo[i + 1].vitez_id ?? (kolo[i + 1].skore_tym1! >= kolo[i + 1].skore_tym2! ? kolo[i + 1].tym1_id : kolo[i + 1].tym2_id);
              const umisteni = kolo.length === 2 ? "final" : null;
              noveZapasy.push({
                hra_id: hra.id, faze: zapas.faze, skupina: null, kolo: (zapas.kolo ?? 1) + 1,
                tym1_id: w1, tym2_id: w2, skore_tym1: null, skore_tym2: null,
                vitez_id: null, kurt: null, poradi_fronta: null,
                cas_zacatek: null, cas_konec: null, umisteni, stav: "ceka",
              });
            }
            if (noveZapasy.length > 0) await supabase.from("turnaj_zapasy").insert(noveZapasy);
          }
        } else if (zapas.kolo === 1 && kolo.length === 2 && !kolo[0].umisteni) {
          // Medaile / umisteni s 4 tymy: po 2 semifinale → finale + o 3. misto
          // (Maly pasma s 2-3 tymy uz maji umisteni="final" pri tvorbe, neresime)
          const m1 = kolo[0], m2 = kolo[1];
          const winner1 = m1.skore_tym1! > m1.skore_tym2! ? m1.tym1_id : m1.tym2_id;
          const loser1  = m1.skore_tym1! > m1.skore_tym2! ? m1.tym2_id : m1.tym1_id;
          const winner2 = m2.skore_tym1! > m2.skore_tym2! ? m2.tym1_id : m2.tym2_id;
          const loser2  = m2.skore_tym1! > m2.skore_tym2! ? m2.tym2_id : m2.tym1_id;
          await supabase.from("turnaj_zapasy").insert([
            { hra_id: hra.id, faze: zapas.faze, skupina: null, kolo: 2, tym1_id: winner1, tym2_id: winner2, skore_tym1: null, skore_tym2: null, vitez_id: null, kurt: null, poradi_fronta: null, cas_zacatek: null, cas_konec: null, umisteni: "final",   stav: "ceka" },
            { hra_id: hra.id, faze: zapas.faze, skupina: null, kolo: 2, tym1_id: loser1,  tym2_id: loser2,  skore_tym1: null, skore_tym2: null, vitez_id: null, kurt: null, poradi_fronta: null, cas_zacatek: null, cas_konec: null, umisteni: "o3misto", stav: "ceka" },
          ]);
        }
      }
    }

    setUpravitId(null);

    // Pokud jsou vsechny zapasy hotove (vc. nove vlozenych), nastav hra.stav=ukonceno
    // Naciti znovu a checkne to v nasledujicim useEffect (viz nize)
    nactiTurnaj();
    setUkladam(null);
  }

  // Kontrola, zda nektery z tymu zapasu uz hraje na jinem kurtu.
  function tymyJsouVolne(zapasId: string): { volne: boolean; konflikt?: string } {
    const z = zapasy.find(zz => zz.id === zapasId);
    if (!z) return { volne: true };
    const probihajici = zapasy.filter(zz => zz.id !== zapasId && zz.stav === "probiha");
    for (const p of probihajici) {
      if ((z.tym1_id && (p.tym1_id === z.tym1_id || p.tym2_id === z.tym1_id))) {
        return { volne: false, konflikt: `${jmenoTymu(z.tym1_id)} uz hraje na kurtu ${p.kurt ?? "?"}` };
      }
      if ((z.tym2_id && (p.tym1_id === z.tym2_id || p.tym2_id === z.tym2_id))) {
        return { volne: false, konflikt: `${jmenoTymu(z.tym2_id)} uz hraje na kurtu ${p.kurt ?? "?"}` };
      }
    }
    return { volne: true };
  }

  async function spustitZapasNaKurtu(zapasId: string, kurt: number) {
    const check = tymyJsouVolne(zapasId);
    if (!check.volne) {
      alert(check.konflikt ?? "Tym uz hraje na jinem kurtu.");
      setKurtModal(null);
      return;
    }
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
    const check = tymyJsouVolne(zapasId);
    if (!check.volne) {
      alert(check.konflikt ?? "Tym uz hraje na jinem kurtu.");
      return;
    }
    if (scoringTyp === "cas") {
      const h = harmonogramMap[zapasId];
      if (h) {
        spustitZapasNaKurtu(zapasId, h.kurt);
      } else {
        setKurtModal(zapasId);
      }
    } else {
      setKurtModal(zapasId);
    }
  }

  async function ulozHraceTymu(tymId: string) {
    const tym = tymy.find(t => t.id === tymId);
    if (!tym) return;
    setUkladamHrace(true);

    const novyH1 = editHrac1.trim();
    const novyH2 = editHrac2.trim();
    let h1Id: string | null = tym.hrac1_id;
    let h2Id: string | null = tym.hrac2_id;

    // Hrac 1 — vytvor nebo update
    if (novyH1) {
      if (h1Id) {
        await supabase.from("hra_ucastnici").update({ jmeno: novyH1 }).eq("id", h1Id);
      } else {
        const { data } = await supabase.from("hra_ucastnici").insert({ hra_id: hra.id, jmeno: novyH1, user_id: null, pohlavi: "neuvedeno" }).select().single();
        h1Id = data?.id ?? null;
      }
    } else if (h1Id) {
      // Smazat priradeni (ale ne ucastnika — mozna je v jine hre)
      // Pro jednoduchost: ponechame ucastnika, jen odvazeme od tymu
      h1Id = null;
    }

    if (novyH2) {
      if (h2Id) {
        await supabase.from("hra_ucastnici").update({ jmeno: novyH2 }).eq("id", h2Id);
      } else {
        const { data } = await supabase.from("hra_ucastnici").insert({ hra_id: hra.id, jmeno: novyH2, user_id: null, pohlavi: "neuvedeno" }).select().single();
        h2Id = data?.id ?? null;
      }
    } else if (h2Id) {
      h2Id = null;
    }

    await supabase.from("turnaj_tymy").update({ hrac1_id: h1Id, hrac2_id: h2Id }).eq("id", tymId);

    setEditHraciTymId(null);
    setEditHrac1("");
    setEditHrac2("");
    setUkladamHrace(false);
    nactiTurnaj();
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

  async function zrusitSpusteni(zapasId: string) {
    await supabase.from("turnaj_zapasy").update({ stav: "ceka", kurt: null, cas_zacatek: null }).eq("id", zapasId);
    nactiTurnaj();
  }

  async function zmenitKurt(zapasId: string, novyKurt: number) {
    await supabase.from("turnaj_zapasy").update({ kurt: novyKurt }).eq("id", zapasId);
    nactiTurnaj();
  }

  // Idempotentni aktualizace 2. faze v DB.
  // - Re-runs engine s aktualnimi vysledky skupin + dohranych playoff.
  // - Pridava jen zapasy, ktere v DB jeste nejsou (dedup podle umisteni/kolo/skupina).
  // - Volana jak po dohrani skupin (vytvorPlayoff = prvni spusteni),
  //   tak po dohrani semi (vyplni finale s realnymi tymy).
  const aktualizujDruhouFazi = useCallback(async () => {
    if (!hra) return;
    setGenerujiPlayoff(true);
    try {
      const s = (hra.settings ?? {}) as Record<string, unknown>;
      const tf = (s.turnaj_format as Record<string, unknown> | undefined) ?? {};
      const fmt: TurnajFormat = {
        scoringTyp: (s.scoring_typ as "gamy" | "body" | "cas") ?? "gamy",
        scoringLimit: (s.scoring_limit as number) ?? 4,
        scoringLimitPlayoff: (s.scoring_limit_playoff as number) ?? (s.scoring_limit as number) ?? 4,
        playoffMode: playoffMode,
        vitezBracket: (s.vitez_bracket as "auto" | "top4" | "top8" | "top16") ?? "auto",
        utechovyPavouk: s.utech_pavouk === true,
        bezSkupin: s.bez_skupin === true,
        pointRule: (s.point_rule as "golden" | "star" | "advantage") ?? "star",
        pocetKurtu: hra.pocet_kurtu,
        casOd: (s.cas_od as string) ?? "16:00",
        casDo: (s.cas_do as string) ?? "20:00",
        delkaSkupinaMin: typeof tf.delka_skupina_min === "number" ? tf.delka_skupina_min : null,
        delkaSemiMin: typeof tf.delka_semi_min === "number" ? tf.delka_semi_min : null,
        delkaFinaleMin: typeof tf.delka_finale_min === "number" ? tf.delka_finale_min : null,
        pauzaMin: typeof tf.pauza_min === "number" ? tf.pauza_min : 1,
      };
      const tymyVeSkupinach: TymVeSkupine[] = tymy.map(t => ({
        tymId: t.id,
        nazev: t.nazev,
        skupina: t.skupina ?? "A",
        nasazeni: t.nasazeni ?? 1,
      }));
      const rozvrh = generujRozvrh(fmt, tymyVeSkupinach);

      // Mapa label -> tym_id: z dohranych skupin + z dohranych playoff zapasu.
      const labelMap: Record<string, string> = {
        ...poradiSkupin(tymy, zapasySkupin),     // "1.A", "2.A", ...
        ...globalniNasazeni(tymy, zapasySkupin), // "1.", "2.", ...
      };
      for (const z of zapasyPlayoff) {
        if (z.skore_tym1 == null || z.skore_tym2 == null) continue;
        const win = z.skore_tym1 > z.skore_tym2 ? z.tym1_id : z.tym2_id;
        const lose = z.skore_tym1 > z.skore_tym2 ? z.tym2_id : z.tym1_id;
        if (!win || !lose) continue;
        const u = z.umisteni ?? "";
        const mSemi = u.match(/^Semi(?:finale)?\s+(\d+)/i);
        if (mSemi) {
          labelMap[`Vitez S${mSemi[1]}`] = win;
          labelMap[`Porazeny S${mSemi[1]}`] = lose;
        }
        const mCF = u.match(/^Ctvrtfinale\s+(\d+)/i);
        if (mCF) labelMap[`Vitez CF ${mCF[1]}`] = win;
        const mPL = u.match(/^Playoff K\d+\s+#(\d+)/i);
        if (mPL) labelMap[`Vitez PL ${mPL[1]}`] = win;
        const mU1 = u.match(/^Utech 1\. kolo/i);
        if (mU1) {
          // Tezsi — labelMap pro utech_2 a utech_finale dela engine pres "Vitez utech N"
          // Tady jen dohledame poradi a pridame Vitez utech N
          // (Pro jednoduchost: pouze pokud existuje vyrazne mapovani)
        }
      }

      const dosazene = dosadDoRozvrhu(zapasy2Faze(rozvrh.zapasy), labelMap);
      // Dedup: zapas povazujem za "uz v DB" pokud sedi kolo + umisteni + skupina.
      const dbKey = (z: { kolo: number | null; umisteni: string | null; skupina: string | null }) =>
        `${z.kolo ?? "x"}|${z.umisteni ?? "x"}|${z.skupina ?? "x"}`;
      const existKeys = new Set(zapasyPlayoff.map(dbKey));
      const kVlozeni = dosazene.filter(z =>
        z.tym1Id != null && z.tym2Id != null && !existKeys.has(dbKey(z)),
      );

      if (kVlozeni.length > 0) {
        const insert = kVlozeni.map(z => ({
          hra_id: hra.id,
          faze: "playoff",
          skupina: z.skupina,
          kolo: z.kolo,
          tym1_id: z.tym1Id,
          tym2_id: z.tym2Id,
          cas_zacatek: z.casZacatek,
          cas_konec: z.casKonec,
          kurt: z.kurt,
          poradi_fronta: z.poradiFronta,
          umisteni: z.umisteni,
          stav: "ceka",
        }));
        const { error } = await supabase.from("turnaj_zapasy").insert(insert);
        if (error) {
          console.error("Chyba pri aktualizaci 2. faze:", error);
        } else {
          nactiTurnaj();
        }
      }
    } finally {
      setGenerujiPlayoff(false);
    }
  }, [hra, tymy, zapasySkupin, zapasyPlayoff, playoffMode, supabase, nactiTurnaj]);

  // Zpetna kompatibilita: tlacitko "Zahajit playoff" v UI.
  const vytvorPlayoff = aktualizujDruhouFazi;

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
              <input type="number" min={0} max={scoringTyp === "cas" ? undefined : (scoringTyp === "gamy" && (hra.settings?.gamy_tiebreak ?? "sudden_death") === "advantage" ? limit + 1 : limit)} value={sc.s1}
                onChange={e => updateScore(z.id, "s1", e.target.value, z.faze)}
                placeholder="—"
                className="w-12 rounded-lg border-2 border-[#801A28] px-1 py-2 text-center text-sm font-bold focus:outline-none" />
              <span className="font-bold text-sm" style={{ color: "#9ca3af" }}>:</span>
              <input type="number" min={0} max={scoringTyp === "cas" ? undefined : (scoringTyp === "gamy" && (hra.settings?.gamy_tiebreak ?? "sudden_death") === "advantage" ? limit + 1 : limit)} value={sc.s2}
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
          if (platne && scoringTyp === "gamy") {
            const w = Math.max(n1, n2), l = Math.min(n1, n2);
            const tb = hra.settings?.gamy_tiebreak ?? "sudden_death";
            if (tb === "sudden_death") {
              // Vitez=limit, porazeny=0..limit-1
              if (w !== limit || l > limit - 1) { platne = false; hint = `Sudden death: max ${limit}:${limit-1}`; }
              if (platne && n1 === n2) { platne = false; hint = "Remiza v gamy neni mozna"; }
            } else {
              // advantage (tenis/padel standard):
              //   normalWin: vitez=limit, porazeny ≤ limit-2 (napr. do 6: 6:0-6:4)
              //   winByTwo:  vitez=limit+1, porazeny=limit-1 (po 5:5 → 6:5 → 7:5)
              //   tiebreakWin: vitez=limit+1, porazeny=limit (tiebreak po 6:6 → 7:6)
              const normalWin = w === limit && l <= limit - 2;
              const winByTwo = w === limit + 1 && l === limit - 1;
              const tiebreakWin = w === limit + 1 && l === limit;
              if (!normalWin && !winByTwo && !tiebreakWin) {
                platne = false;
                hint = `Advantage: ${limit}:0–${limit}:${limit-2}, ${limit+1}:${limit-1} nebo ${limit+1}:${limit}`;
              }
            }
          }
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
              <button onClick={onSmazatRequest}
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
          { k: "startovne",    l: "Startovne" },
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
            <div><span style={{ color: "#9ca3af" }}>Playoff:</span> <strong>{
              playoffMode === "bez" ? "ne"
              : playoffMode === "medaile" ? "Final Four"
              : playoffMode === "vitez" ? "Single elimination"
              : "Multi-tier (o umístění)"
            }</strong></div>
            {hra.settings?.cas_od && hra.settings?.cas_do && (
              <div className="col-span-2"><span style={{ color: "#9ca3af" }}>Cas:</span> <strong>{hra.settings.cas_od} – {hra.settings.cas_do}</strong></div>
            )}
          </div>
        </section>
      )}

      {/* ===== ROZLOSOVANI ===== */}
      {aktivniTab === "rozlosovani" && (() => {
        const vsechny = [...zapasy].sort((a, b) => {
          const pa = a.poradi_fronta, pb = b.poradi_fronta;
          if (pa != null && pb != null) return pa - pb;
          const ca = a.cas_zacatek ?? "", cb = b.cas_zacatek ?? "";
          if (ca && cb) return ca.localeCompare(cb);
          if (ca) return -1;
          if (cb) return 1;
          return (a.faze ?? "").localeCompare(b.faze ?? "");
        });
        const fazeLabel = fazeLabelGlobal;
        return (
          <div className="flex flex-col gap-3">
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              Casovy rozvrh vsech zapasu. Klikni na kurt pro zmenu, na skore pro zadani vysledku.
            </p>
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-xs" style={{ color: "#6b7280", backgroundColor: "#fafafa" }}>
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Cas</th>
                    <th className="text-left px-2 py-2 font-medium">Kurt</th>
                    <th className="text-left px-3 py-2 font-medium">Faze</th>
                    <th className="text-left px-3 py-2 font-medium">Zapas</th>
                    <th className="text-right px-3 py-2 font-medium">Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {vsechny.map(z => {
                    const hotovo = z.skore_tym1 != null;
                    const probiha = z.stav === "probiha";
                    const jeUpravovany = upravitId === z.id;
                    const jeNezadany = z.skore_tym1 == null;
                    const zobrazInputy = jeEditor && (jeNezadany || jeUpravovany);
                    const limit = z.faze === "skupina" ? scoringLimit : scoringLimitPlayoff;
                    const sc = getScore(z.id);
                    return (
                      <tr key={z.id} className="border-t border-zinc-100 align-top">
                        <td className="px-3 py-3 whitespace-nowrap text-xs" style={{ color: "#374151" }}>
                          {z.cas_zacatek
                            ? <>{z.cas_zacatek}<span style={{ color: "#9ca3af" }}>–{z.cas_konec}</span></>
                            : <span style={{ color: "#9ca3af" }}>—</span>}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap relative">
                          {jeEditor && !jeZruseno && !probiha && !hotovo ? (
                            <button onClick={() => setKurtDropdownPro(kurtDropdownPro === z.id ? null : z.id)}
                              className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium hover:bg-zinc-50"
                              style={{ color: "#374151" }}>
                              {z.kurt ? `K${z.kurt}` : "—"} ⌄
                            </button>
                          ) : (
                            <span className="text-xs" style={{ color: probiha ? "#16a34a" : "#374151" }}>
                              {z.kurt ? `K${z.kurt}` : "—"}
                            </span>
                          )}
                          {kurtDropdownPro === z.id && (
                            <div className="absolute z-20 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg p-1 min-w-[80px]">
                              {Array.from({ length: hra.pocet_kurtu }, (_, i) => i + 1).map(k => (
                                <button key={k}
                                  onClick={() => { zmenitKurt(z.id, k); setKurtDropdownPro(null); }}
                                  className={`block w-full text-left px-3 py-1.5 text-xs rounded hover:bg-zinc-50 ${z.kurt === k ? "font-bold" : ""}`}
                                  style={{ color: "#374151" }}>
                                  Kurt {k}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs whitespace-nowrap" style={{ color: "#9ca3af" }}>
                          {fazeLabel(z)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex-1 text-right text-sm font-medium" style={{ color: "#0A0A0A" }}>
                              {jmenoTymu(z.tym1_id)}
                            </span>
                            {zobrazInputy ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <input type="number" min={0}
                                  value={sc.s1} onChange={e => updateScore(z.id, "s1", e.target.value, z.faze)}
                                  placeholder="—"
                                  className="w-10 rounded border-2 border-[#801A28] px-1 py-1 text-center text-sm font-bold focus:outline-none" />
                                <span className="font-bold text-xs" style={{ color: "#9ca3af" }}>:</span>
                                <input type="number" min={0}
                                  value={sc.s2} onChange={e => updateScore(z.id, "s2", e.target.value, z.faze)}
                                  placeholder="—"
                                  className="w-10 rounded border-2 border-[#801A28] px-1 py-1 text-center text-sm font-bold focus:outline-none" />
                              </div>
                            ) : (
                              <span className="shrink-0 text-center w-14">
                                {hotovo
                                  ? <span className="text-sm font-bold" style={{ color: "#0A0A0A" }}>{z.skore_tym1}:{z.skore_tym2}</span>
                                  : <span className="text-xs" style={{ color: "#9ca3af" }}>vs</span>}
                              </span>
                            )}
                            <span className="flex-1 text-sm font-medium" style={{ color: "#0A0A0A" }}>
                              {jmenoTymu(z.tym2_id)}
                            </span>
                          </div>
                          {zobrazInputy && (
                            <div className="flex items-center justify-end gap-2 mt-2">
                              {jeUpravovany && (
                                <button onClick={() => setUpravitId(null)}
                                  className="text-xs underline" style={{ color: "#9ca3af" }}>Zrusit</button>
                              )}
                              <button onClick={() => ulozSkore(z.id)} disabled={ukladam === z.id}
                                className="rounded-lg px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
                                style={{ backgroundColor: "#801A28" }}>
                                {ukladam === z.id ? "..." : "Ulozit"}
                              </button>
                            </div>
                          )}
                          {!zobrazInputy && jeEditor && hotovo && !jeUpravovany && (
                            <div className="flex justify-end mt-1">
                              <button onClick={() => { setUpravitId(z.id); setScoreMap(prev => ({ ...prev, [z.id]: { s1: String(z.skore_tym1), s2: String(z.skore_tym2) } })); }}
                                className="text-xs underline" style={{ color: "#9ca3af" }}>upravit</button>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          {hotovo ? (
                            <span className="text-xs" style={{ color: "#16a34a" }}>Hotovo</span>
                          ) : probiha ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>Probiha</span>
                              {jeEditor && !jeZruseno && (
                                <button onClick={() => zrusitSpusteni(z.id)}
                                  className="text-xs underline" style={{ color: "#9ca3af" }}>zrusit start</button>
                              )}
                            </div>
                          ) : jeEditor && !jeZruseno ? (
                            <button onClick={() => spustitZapas(z.id)}
                              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                              style={{ backgroundColor: "#801A28" }}>
                              Spustit
                            </button>
                          ) : (
                            <span className="text-xs" style={{ color: "#9ca3af" }}>Planovany</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

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
                        const skupinaLabel = fazeLabelGlobal(z);
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

        // GAMY / BODY format: fronta s fixnim poradim podle poradi_fronta (engine).
        // Poradi se NEMENI ani po dohrani — slouzi jako tabulkove cislo zapasu.
        const fronta = zapasy.slice().sort((a, b) => {
          const pa = a.poradi_fronta, pb = b.poradi_fronta;
          if (pa != null && pb != null) return pa - pb;
          if (pa != null) return -1;
          if (pb != null) return 1;
          return (a.created_at ?? "").localeCompare(b.created_at ?? "");
        });

        return (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: "#F2EDE4" }}>
              <p className="text-xs" style={{ color: "#374151" }}>
                <strong>Fronta zapasu</strong> — kazdy zapas spustis kliknutim na <em>Spustit</em>, vyberes kurt. Skore zadej primo v radku.
              </p>
            </div>
            <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100" style={{ backgroundColor: "#fafafa" }}>
                <p className="text-sm font-semibold" style={{ color: "#801A28" }}>Fronta zapasu ({fronta.length})</p>
              </div>
              <div className="divide-y divide-zinc-50">
                {fronta.map((z, idx) => {
                  const hotovo = z.skore_tym1 != null;
                  const probiha = z.stav === "probiha";
                  const jeUpravovany = upravitId === z.id;
                  const zobrazInputy = jeEditor && (probiha || jeUpravovany) && !jeZruseno;
                  const skupinaLabel = z.skupina ? `Skupina ${z.skupina}` : (z.umisteni ?? z.faze);
                  const sc = getScore(z.id);
                  const limit = z.faze === "skupina" ? scoringLimit : scoringLimitPlayoff;
                  const cisloZapasu = z.poradi_fronta ?? idx + 1;
                  return (
                    <div key={z.id} className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-12 text-center">
                          <p className="text-xs font-bold" style={{ color: hotovo ? "#9ca3af" : "#0A0A0A" }}>#{cisloZapasu}</p>
                          {z.kurt && (probiha || hotovo) && (
                            <p className="text-xs mt-0.5" style={{ color: "#801A28" }}>Kurt {z.kurt}</p>
                          )}
                        </div>
                        <div className="w-px self-stretch" style={{ backgroundColor: hotovo ? "#e5e7eb" : probiha ? "#16a34a" : "#801A28", opacity: 0.4 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs mb-1" style={{ color: "#9ca3af" }}>{skupinaLabel}</p>
                          <div className="flex items-center gap-2">
                            <span className="flex-1 text-right text-sm font-medium" style={{ color: hotovo && !jeUpravovany ? "#6b7280" : "#0A0A0A" }}>
                              {jmenoTymu(z.tym1_id)}
                            </span>
                            {zobrazInputy ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <input type="number" min={0}
                                  value={sc.s1} onChange={e => updateScore(z.id, "s1", e.target.value, z.faze)}
                                  placeholder="—"
                                  className="w-10 rounded border-2 border-[#801A28] px-1 py-1 text-center text-sm font-bold focus:outline-none" />
                                <span className="font-bold text-xs" style={{ color: "#9ca3af" }}>:</span>
                                <input type="number" min={0}
                                  value={sc.s2} onChange={e => updateScore(z.id, "s2", e.target.value, z.faze)}
                                  placeholder="—"
                                  className="w-10 rounded border-2 border-[#801A28] px-1 py-1 text-center text-sm font-bold focus:outline-none" />
                              </div>
                            ) : (
                              <span className="shrink-0 text-center w-14">
                                {hotovo
                                  ? <span className="text-sm font-bold" style={{ color: "#0A0A0A" }}>{z.skore_tym1}:{z.skore_tym2}</span>
                                  : <span className="text-xs" style={{ color: "#d1d5db" }}>vs</span>}
                              </span>
                            )}
                            <span className="flex-1 text-sm font-medium" style={{ color: hotovo && !jeUpravovany ? "#6b7280" : "#0A0A0A" }}>
                              {jmenoTymu(z.tym2_id)}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {hotovo && !jeUpravovany ? (
                            <>
                              <span className="text-xs" style={{ color: "#16a34a" }}>Hotovo</span>
                              {jeEditor && (
                                <button onClick={() => { setUpravitId(z.id); setScoreMap(prev => ({ ...prev, [z.id]: { s1: String(z.skore_tym1), s2: String(z.skore_tym2) } })); }}
                                  className="text-xs underline" style={{ color: "#9ca3af" }}>upravit</button>
                              )}
                            </>
                          ) : probiha ? (
                            <>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>Probiha</span>
                              {jeEditor && !jeZruseno && <button onClick={() => zrusitSpusteni(z.id)} className="text-xs underline" style={{ color: "#9ca3af" }}>zrusit start</button>}
                            </>
                          ) : (
                            <>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>Ve fronte</span>
                              {jeEditor && !jeZruseno && (
                                <button onClick={() => spustitZapas(z.id)}
                                  className="rounded-lg px-3 py-1 text-xs font-semibold text-white"
                                  style={{ backgroundColor: "#801A28" }}>
                                  Spustit
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      {zobrazInputy && (
                        <div className="flex items-center justify-end gap-2 mt-2 pl-15">
                          {jeUpravovany && (
                            <button onClick={() => setUpravitId(null)}
                              className="text-xs underline" style={{ color: "#9ca3af" }}>Zrusit</button>
                          )}
                          <button onClick={() => ulozSkore(z.id)} disabled={ukladam === z.id}
                            className="rounded-lg px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
                            style={{ backgroundColor: "#801A28" }}>
                            {ukladam === z.id ? "..." : "Ulozit skore"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            {playoff && !playoffExistuje && (() => {
              // Placeholder bracket — pokud playoff jeste neni vygenerovan
              const numSkupin = skupinyNazvy.length;
              if (numSkupin === 0) return null;
              const bracketLabel = (sIdx: number, pos: number) => `${pos}${SKUPINY_NAZVY_LOCAL[sIdx]}`;
              const pasma: { label: string; matches: { tym1: string; tym2: string; label: string }[] }[] = [];

              // Vsichni tymy serazeni: 1A, 1B, 1C, 2A, 2B, 2C, ...
              const vsichniTymy: string[] = [];
              const maxPos = Math.max(...skupinyNazvy.map(s => (skupinyMap[s] ?? []).length));
              for (let pos = 0; pos < maxPos; pos++) {
                skupinyNazvy.forEach((_s, sIdx) => { vsichniTymy.push(bracketLabel(sIdx, pos + 1)); });
              }
              const totalN = vsichniTymy.length;

              if (playoffMode === "umisteni") {
                const pocetPasem = Math.ceil(totalN / 4);
                for (let p = 0; p < pocetPasem; p++) {
                  const tymyPasma = vsichniTymy.slice(p * 4, (p + 1) * 4);
                  if (tymyPasma.length < 2) continue;
                  const matches: { tym1: string; tym2: string; label: string }[] = [];
                  if (tymyPasma.length === 4) {
                    matches.push({ tym1: tymyPasma[0], tym2: tymyPasma[3], label: "Semifinále" });
                    matches.push({ tym1: tymyPasma[1], tym2: tymyPasma[2], label: "Semifinále" });
                  } else {
                    matches.push({ tym1: tymyPasma[0], tym2: tymyPasma[1], label: "Finále" });
                  }
                  pasma.push({ label: `Pásmo ${p + 1} (${p * 4 + 1}.–${(p + 1) * 4}.)`, matches });
                }
              } else if (playoffMode === "vitez") {
                let bracketSize = 2;
                while (bracketSize * 2 <= totalN && bracketSize < 16) bracketSize *= 2;
                const top = vsichniTymy.slice(0, bracketSize);
                const matches: { tym1: string; tym2: string; label: string }[] = [];
                const koloLabel = bracketSize === 16 ? "Osmifinále" : bracketSize === 8 ? "Čtvrtfinále" : bracketSize === 4 ? "Semifinále" : "Finále";
                for (let i = 0; i < bracketSize / 2; i++) {
                  matches.push({ tym1: top[i], tym2: top[bracketSize - 1 - i], label: koloLabel });
                }
                pasma.push({ label: `Vyřazovací pavouk (top ${bracketSize})`, matches });
              } else if (playoffMode === "medaile") {
                const top4 = vsichniTymy.slice(0, 4);
                const matches: { tym1: string; tym2: string; label: string }[] = [];
                if (top4.length === 4) {
                  matches.push({ tym1: top4[0], tym2: top4[3], label: "Semifinále" });
                  matches.push({ tym1: top4[1], tym2: top4[2], label: "Semifinále" });
                } else if (top4.length >= 2) {
                  matches.push({ tym1: top4[0], tym2: top4[1], label: "Finále" });
                }
                pasma.push({ label: "Final Four (top 4)", matches });
              }
              return (
                <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-zinc-100" style={{ backgroundColor: "#fafafa" }}>
                    <p className="text-sm font-semibold" style={{ color: "#801A28" }}>Playoff (struktura)</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                      Zapasy se vygeneruji po dokonceni skupin a kliknuti na &quot;Zahajit playoff&quot;.
                    </p>
                  </div>
                  {pasma.map((pasmo, pIdx) => (
                    <div key={pIdx}>
                      <div className="px-5 py-1.5 border-b border-zinc-50">
                        <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>{pasmo.label}</p>
                      </div>
                      <div className="divide-y divide-zinc-50">
                        {pasmo.matches.map((s, sIdx) => (
                          <div key={sIdx} className="px-5 py-2 flex items-center gap-2 text-xs" style={{ color: "#9ca3af" }}>
                            <span className="w-20">{s.label}</span>
                            <span className="flex-1 text-right font-semibold">{s.tym1}</span>
                            <span style={{ color: "#d1d5db" }}>vs</span>
                            <span className="flex-1 font-semibold">{s.tym2}</span>
                          </div>
                        ))}
                        <div className="px-5 py-2 text-xs italic" style={{ color: "#d1d5db" }}>
                          {playoffMode === "vitez" ? "Další kola se vygenerují po dohrání předchozího." : "Finále & o 3. místo se vygeneruje po dohrání semifinále."}
                        </div>
                      </div>
                    </div>
                  ))}
                </section>
              );
            })()}
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
                function labelKola(zaps: TurnajZapas[]): string {
                  const fin = zaps.find(z => z.umisteni === "final");
                  if (fin && zaps.length === 1) return "Finále";
                  if (fin && zaps.length === 2) return "Finále & o 3. místo";
                  if (zaps.length === 1) return "Finále";
                  if (zaps.length === 2) return "Semifinále";
                  if (zaps.length <= 4) return "Čtvrtfinále";
                  if (zaps.length <= 8) return "Osmifinále";
                  return "Šestnáctifinále";
                }
                return faze.map(f => {
                  const matchesByKolo: Record<number, TurnajZapas[]> = {};
                  zapasyPlayoff.filter(z => z.faze === f).forEach(z => {
                    const k = z.kolo ?? 1;
                    if (!matchesByKolo[k]) matchesByKolo[k] = [];
                    matchesByKolo[k].push(z);
                  });
                  const kola = Object.keys(matchesByKolo).map(Number).sort((a, b) => a - b);
                  const pasmoIdx = f === "playoff" ? 1 : parseInt(f.replace("playoff_pas_", ""));
                  const pasmoLabel = playoffMode === "umisteni"
                    ? `Pásmo ${pasmoIdx} (${(pasmoIdx - 1) * 4 + 1}.–${pasmoIdx * 4}.)`
                    : playoffMode === "vitez"
                    ? "Vyřazovací pavouk"
                    : "Final Four";
                  return (
                    <div key={f}>
                      <div className="px-5 py-2 border-b border-zinc-50" style={{ backgroundColor: "#fafafa" }}>
                        <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>{pasmoLabel}</p>
                      </div>
                      {kola.map((k, kIdx) => {
                        const zaps = matchesByKolo[k];
                        const isLast = kIdx === kola.length - 1;
                        const koloLabel = labelKola(zaps);
                        const fin = zaps.find(z => z.umisteni === "final");
                        const o3 = zaps.find(z => z.umisteni === "o3misto");
                        const ostatni = zaps.filter(z => !z.umisteni);
                        return (
                          <div key={k}>
                            <div className="px-5 py-1.5 border-b border-zinc-50">
                              <p className="text-xs" style={{ color: "#9ca3af" }}>{koloLabel}</p>
                            </div>
                            <div className="divide-y divide-zinc-50">
                              {ostatni.map(z => renderZapas(z, scoringLimitPlayoff))}
                              {fin && (
                                <div>
                                  <div className="px-5 py-1 text-xs" style={{ color: "#801A28", backgroundColor: "#fff5f5" }}>Finále (1. místo)</div>
                                  {renderZapas(fin, scoringLimitPlayoff)}
                                </div>
                              )}
                              {o3 && (
                                <div>
                                  <div className="px-5 py-1 text-xs" style={{ color: "#9ca3af" }}>O 3. místo</div>
                                  {renderZapas(o3, scoringLimitPlayoff)}
                                </div>
                              )}
                            </div>
                            {isLast && zaps.every(z => z.skore_tym1 == null) === false && zaps.some(z => z.skore_tym1 == null) === false && playoffMode !== "vitez" && !fin && !o3 && (
                              <div className="px-5 py-3 text-xs italic border-t border-zinc-50" style={{ color: "#9ca3af" }}>
                                Další kolo se vygeneruje po dohrání všech zápasů.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                });
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
                const skupinaLabel = fazeLabelGlobal(z);
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
                  const editujem = editHraciTymId === t.id;
                  return (
                    <div key={t.id} className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold w-5 shrink-0" style={{ color: "#9ca3af" }}>{t.skupina}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>{t.nazev}</p>
                          {!editujem && (
                            (h1 || h2) ? (
                              <p className="text-xs" style={{ color: "#6b7280" }}>
                                {h1?.jmeno ?? "—"}{h2 ? ` · ${h2.jmeno}` : ""}
                              </p>
                            ) : (
                              <p className="text-xs italic" style={{ color: "#9ca3af" }}>Bez prirazenych hracu</p>
                            )
                          )}
                        </div>
                        {jeEditor && !jeZruseno && !editujem && (
                          <button onClick={() => {
                            setEditHraciTymId(t.id);
                            setEditHrac1(h1?.jmeno ?? "");
                            setEditHrac2(h2?.jmeno ?? "");
                          }}
                            className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium hover:bg-zinc-50"
                            style={{ color: "#801A28" }}>
                            Upravit
                          </button>
                        )}
                      </div>
                      {editujem && (
                        <div className="mt-3 flex flex-col gap-2">
                          <div className="flex gap-2">
                            <input type="text" value={editHrac1} onChange={e => setEditHrac1(e.target.value)}
                              placeholder="Jmeno hrace 1"
                              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                            <input type="text" value={editHrac2} onChange={e => setEditHrac2(e.target.value)}
                              placeholder="Jmeno hrace 2"
                              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => { setEditHraciTymId(null); setEditHrac1(""); setEditHrac2(""); }}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium border border-zinc-200"
                              style={{ color: "#374151" }}>
                              Zrusit
                            </button>
                            <button onClick={() => ulozHraceTymu(t.id)} disabled={ukladamHrace}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                              style={{ backgroundColor: "#801A28" }}>
                              {ukladamHrace ? "Ukladam..." : "Ulozit"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        );
      })()}

      {/* ===== STARTOVNE ===== */}
      {aktivniTab === "startovne" && (
        <StartovneTab hra={hra} jeEditor={jeEditor} />
      )}

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
  const router = useRouter();
  const supabase = createClient();

  const [hra, setHra] = useState<Hra | null>(null);
  const [ucastnici, setUcastnici] = useState<Ucastnik[]>([]);
  const [zapasy, setZapasy] = useState<Zapas[]>([]);
  const [jeEditor, setJeEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [smazatModal, setSmazatModal] = useState(false);
  const [mazem, setMazem] = useState(false);
  const [pocty, setPocty] = useState<{ pocetZapasu: number; pocetUcastniku: number } | null>(null);
  const [potvrzeni, setPotvrzeni] = useState(false);
  // Top-level tab pro americano/mexicano (turnaj ma vlastni)
  const [topTab, setTopTab] = useState<"hra" | "startovne">("hra");
  const [zkopirovano, setZkopirovano] = useState(false);

  async function sdilet() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    // Web Share API pokud existuje
    type WindowWithShare = Window & { navigator: Navigator & { share?: (d: ShareData) => Promise<void> } };
    const win = window as WindowWithShare;
    if (win.navigator.share) {
      try {
        await win.navigator.share({ title: hra?.nazev ?? "Hra", url });
        return;
      } catch { /* user cancel */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setZkopirovano(true);
      setTimeout(() => setZkopirovano(false), 2000);
    } catch {
      // fallback
      prompt("Zkopíruj odkaz:", url);
    }
  }

  async function otevriSmazatModal() {
    if (!hra) return;
    setPotvrzeni(false);
    setPocty(null);
    setSmazatModal(true);
    const p = await nactiPoctyMazani(supabase, hra.id, hra.typ as HraTyp);
    setPocty(p);
  }

  async function provedSmazani() {
    if (!hra) return;
    setMazem(true);
    const { error } = await smazatHruDb(supabase, hra.id, hra.typ as HraTyp);
    if (error) {
      alert(error);
      setMazem(false);
      return;
    }
    setMazem(false);
    router.push("/hry");
  }

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
              <div className="flex-1 min-w-0">
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
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center gap-2">
                  {(() => {
                    const startovne = (hra.settings as { startovne?: { castka?: number } } | null)?.startovne;
                    if (!startovne?.castka) return null;
                    if (hra.typ === "turnaj") {
                      return (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                          Startovné {startovne.castka.toLocaleString("cs-CZ")} Kč
                        </span>
                      );
                    }
                    return (
                      <button onClick={() => setTopTab("startovne")}
                        className="text-xs font-medium px-2.5 py-1 rounded-full hover:opacity-80"
                        style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                        Startovné {startovne.castka.toLocaleString("cs-CZ")} Kč
                      </button>
                    );
                  })()}
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: hra.stav === "probiha" ? "#dcfce7" : "#f3f4f6", color: hra.stav === "probiha" ? "#16a34a" : "#6b7280" }}>
                    {hra.stav === "probiha" ? "Probiha" : "Ukonceno"}
                  </span>
                </div>
                <button onClick={sdilet}
                  className="text-xs underline hover:no-underline"
                  style={{ color: "#801A28" }}>
                  {zkopirovano ? "Zkopírováno ✓" : "Sdílet odkaz"}
                </button>
              </div>
            </div>
          </div>

          {/* Top tab pro americano/mexicano */}
          {hra.typ !== "turnaj" && (
            <div className="flex gap-1 border-b border-zinc-200 mb-6">
              {([
                ["hra", "Hra"],
                ["startovne", "Startovné"],
              ] as Array<["hra" | "startovne", string]>).map(([k, l]) => (
                <button key={k} onClick={() => setTopTab(k)}
                  className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px"
                  style={{ borderColor: topTab === k ? "#801A28" : "transparent", color: topTab === k ? "#801A28" : "#6b7280" }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {hra.typ === "americano" && topTab === "hra" && (
            <AmericanoView hra={hra} ucastnici={ucastnici} zapasy={zapasy} jeEditor={jeEditor} nactiData={nactiData} />
          )}
          {hra.typ === "mexicano" && topTab === "hra" && (
            <MexicanoView hra={hra} ucastnici={ucastnici} zapasy={zapasy} jeEditor={jeEditor} nactiData={nactiData} />
          )}
          {hra.typ !== "turnaj" && topTab === "startovne" && (
            <StartovneTab hra={hra} jeEditor={jeEditor} />
          )}
          {hra.typ === "turnaj" && (
            <TurnajView hra={hra} jeEditor={jeEditor} onSmazatRequest={otevriSmazatModal} />
          )}

          {jeEditor && !(hra.typ === "turnaj" && hra.settings?.zruseno) && (
            <div className="mt-10 pt-6 border-t border-zinc-200">
              <p className="text-xs mb-2" style={{ color: "#9ca3af" }}>Nebezpecna zona</p>
              <button onClick={otevriSmazatModal}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium hover:bg-red-50"
                style={{ color: "#801A28" }}>
                Smazat trvale
              </button>
            </div>
          )}

          {smazatModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => !mazem && setSmazatModal(false)}>
              <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#801A28" }}>Trvale smazat hru?</h3>
                <p className="text-sm mb-3" style={{ color: "#6b7280" }}>
                  Tato akce je <strong>nevratna</strong>. Smaze vsechny zapasy, ucastniky i nastaveni hry.
                </p>
                <div className="rounded-lg bg-zinc-50 px-4 py-3 mb-4 text-sm" style={{ color: "#374151" }}>
                  <p><strong>{hra.nazev}</strong></p>
                  {pocty ? (
                    <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                      {pocty.pocetUcastniku} ucastniku &middot; {pocty.pocetZapasu} zapasu
                    </p>
                  ) : (
                    <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>Pocitam zaznamy...</p>
                  )}
                </div>
                <label className="flex items-start gap-2 mb-4 cursor-pointer">
                  <input type="checkbox" checked={potvrzeni} onChange={e => setPotvrzeni(e.target.checked)}
                    className="mt-0.5" />
                  <span className="text-sm" style={{ color: "#374151" }}>
                    Rozumim, ze data nepujdou obnovit.
                  </span>
                </label>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setSmazatModal(false)} disabled={mazem}
                    className="rounded-lg px-4 py-2 text-sm font-medium border border-zinc-200 hover:bg-zinc-50"
                    style={{ color: "#374151" }}>
                    Ponechat
                  </button>
                  <button onClick={provedSmazani} disabled={mazem || !potvrzeni}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                    style={{ backgroundColor: "#801A28" }}>
                    {mazem ? "Mazu..." : "Ano, smazat trvale"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
