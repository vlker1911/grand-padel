"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { generujAmericano } from "@/lib/americano";

type Typ = "americano" | "mexicano" | "turnaj";

const FORMATY: { typ: Typ; nazev: string; popis: string }[] = [
  { typ: "americano", nazev: "Americano", popis: "Rotujici pary, individualni skore. Kazdy hraje s kazdym." },
  { typ: "mexicano", nazev: "Mexicano", popis: "Hraci se presouvaji po kurtech podle vysledku. Hraje se na cas." },
  { typ: "turnaj",   nazev: "Turnaj",    popis: "Skupiny + volitelny playoff. Pary nebo jednotlivci. Body nebo gamy." },
];

type HracEntry = { jmeno: string; email: string };
type ParEntry  = { id: number; jmeno1: string; pohlavi1: string; jmeno2: string; pohlavi2: string };
type SingEntry = { id: number; jmeno: string; pohlavi: string };

const SKUPINY_NAZVY = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function odhadMinut(body: number) {
  if (body === 16) return 8;
  if (body === 24) return 12;
  if (body === 32) return 15;
  return Math.round(body * 0.45);
}

function sparujSingles(players: SingEntry[]): ParEntry[] {
  const filled = players.filter(p => p.jmeno.trim());
  const muzi   = [...filled.filter(p => p.pohlavi === "m")].sort(() => Math.random() - 0.5);
  const zeny   = [...filled.filter(p => p.pohlavi === "z")].sort(() => Math.random() - 0.5);
  const ostatni = [...filled.filter(p => p.pohlavi !== "m" && p.pohlavi !== "z")].sort(() => Math.random() - 0.5);

  const result: ParEntry[] = [];
  let id = 10000;
  const minMix = Math.min(muzi.length, zeny.length);
  for (let i = 0; i < minMix; i++) {
    result.push({ id: id++, jmeno1: muzi[i].jmeno, pohlavi1: "m", jmeno2: zeny[i].jmeno, pohlavi2: "z" });
  }
  const zbyvajici = [...muzi.slice(minMix), ...zeny.slice(minMix), ...ostatni].sort(() => Math.random() - 0.5);
  for (let i = 0; i + 1 < zbyvajici.length; i += 2) {
    result.push({ id: id++, jmeno1: zbyvajici[i].jmeno, pohlavi1: zbyvajici[i].pohlavi, jmeno2: zbyvajici[i + 1].jmeno, pohlavi2: zbyvajici[i + 1].pohlavi });
  }
  return result;
}

function vypocitejPocetSkupin(n: number): number {
  if (n <= 4)  return 1;
  if (n <= 8)  return 2;
  if (n <= 12) return 3;
  if (n <= 16) return 4;
  return Math.ceil(n / 4);
}

function rozdelDoSkupin(tymy: ParEntry[], numSkupin: number): ParEntry[][] {
  const groups: ParEntry[][] = Array.from({ length: numSkupin }, () => []);
  tymy.forEach((t, i) => groups[i % numSkupin].push(t));
  return groups;
}

export default function NovaHraPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [krok, setKrok] = useState(1);
  const [typ,  setTyp]  = useState<Typ | null>(null);

  // Sdilene parametry
  const [pocetKurtu,     setPocetKurtu]     = useState<number | "">(2);
  const [cislaMexicano,  setCislaMexicano]  = useState("1, 2");
  const [casOd,          setCasOd]          = useState("16:00");
  const [casDo,          setCasDo]          = useState("18:00");

  // Americano / Mexicano
  const [pocetHracu,  setPocetHracu]  = useState<number | "">(8);
  const [bodyNaZapas, setBodyNaZapas] = useState(24);
  const [minutNaKolo, setMinutNaKolo] = useState(12);
  const [minutPresunu,setMinutPresunu]= useState(3);
  const [hraci,       setHraci]       = useState<HracEntry[]>(Array.from({ length: 8 }, () => ({ jmeno: "", email: "" })));

  // Turnaj
  const [typParovani,        setTypParovani]        = useState<"pary" | "singles" | "mix">("pary");
  const [pocetTymu,          setPocetTymu]          = useState<number | "">(8);
  const [pocetSinglesHracu,  setPocetSinglesHracu]  = useState<number | "">(8);
  const [scoringTyp,         setScoringTyp]         = useState<"gamy" | "body" | "cas">("gamy");
  const [scoringLimit,       setScoringLimit]       = useState(4);
  const [scoringLimitPlayoff,setScoringLimitPlayoff]= useState(6);
  const [odlisnyScoring,     setOdlisnyScoring]     = useState(false);
  const [playoff,            setPlayoff]            = useState(true);
  const [typPlayoff,         setTypPlayoff]         = useState<"krizovy" | "primy">("krizovy");
  const [multiTier,          setMultiTier]          = useState(true);
  const [pary,               setPary]               = useState<ParEntry[]>(Array.from({ length: 8 }, (_, i) => ({ id: i, jmeno1: "", pohlavi1: "", jmeno2: "", pohlavi2: "" })));
  const [singlesHraci,       setSinglesHraci]       = useState<SingEntry[]>(Array.from({ length: 8 }, (_, i) => ({ id: i, jmeno: "", pohlavi: "" })));
  const [losovanoSingles,    setLosovanoSingles]    = useState<ParEntry[]>([]);
  const [losovano,           setLosovano]           = useState(false);

  const [nazev, setNazev] = useState("");
  const [stav,  setStav]  = useState<"idle" | "loading" | "chyba">("idle");
  const [chyba, setChyba] = useState("");

  // === Americano/Mexicano helpers ===
  function nastavPocetHracu(n: number) {
    const v = Math.max(4, n);
    setPocetHracu(v);
    setHraci(prev => v > prev.length
      ? [...prev, ...Array.from({ length: v - prev.length }, () => ({ jmeno: "", email: "" }))]
      : prev.slice(0, v));
  }
  function pridejHrace() { setHraci([...hraci, { jmeno: "", email: "" }]); setPocetHracu(typeof pocetHracu === "number" ? pocetHracu + 1 : 1); }
  function odeberHrace(i: number) { if (hraci.length <= 4) return; const n = hraci.filter((_, idx) => idx !== i); setHraci(n); setPocetHracu(n.length); }
  function updateHrac(i: number, pole: keyof HracEntry, hodnota: string) { const n = [...hraci]; n[i] = { ...n[i], [pole]: hodnota }; setHraci(n); }

  // === Turnaj helpers ===
  function nastavPocetTymu(n: number) {
    const v = Math.min(128, Math.max(2, n));
    setPocetTymu(v);
    setPary(prev => v > prev.length
      ? [...prev, ...Array.from({ length: v - prev.length }, (_, i) => ({ id: prev.length + i, jmeno1: "", pohlavi1: "", jmeno2: "", pohlavi2: "" }))]
      : prev.slice(0, v));
  }
  function nastavPocetSingles(n: number) {
    const v = Math.min(256, Math.max(2, n));
    setPocetSinglesHracu(v);
    setSinglesHraci(prev => v > prev.length
      ? [...prev, ...Array.from({ length: v - prev.length }, (_, i) => ({ id: prev.length + i, jmeno: "", pohlavi: "" }))]
      : prev.slice(0, v));
    setLosovano(false);
  }
  function updatePar(id: number, pole: keyof ParEntry, hodnota: string) { setPary(prev => prev.map(p => p.id === id ? { ...p, [pole]: hodnota } : p)); }
  function pridejPar() { if (pary.length >= 128) return; const newId = Math.max(0, ...pary.map(p => p.id)) + 1; setPary([...pary, { id: newId, jmeno1: "", pohlavi1: "", jmeno2: "", pohlavi2: "" }]); setPocetTymu(pary.length + 1); }
  function odeberPar(id: number) { if (pary.length <= 2) return; setPary(prev => prev.filter(p => p.id !== id)); setPocetTymu(prev => typeof prev === "number" ? prev - 1 : prev); }
  function updateSingle(id: number, pole: keyof SingEntry, hodnota: string) { setSinglesHraci(prev => prev.map(s => s.id === id ? { ...s, [pole]: hodnota } : s)); }
  function pridejSingle() { const newId = Math.max(0, ...singlesHraci.map(s => s.id)) + 1; setSinglesHraci([...singlesHraci, { id: newId, jmeno: "", pohlavi: "" }]); setPocetSinglesHracu(singlesHraci.length + 1); setLosovano(false); }
  function odeberSingle(id: number) { if (singlesHraci.length <= 2) return; setSinglesHraci(prev => prev.filter(s => s.id !== id)); setPocetSinglesHracu(prev => typeof prev === "number" ? prev - 1 : prev); setLosovano(false); }
  function losuj() { setLosovanoSingles(sparujSingles(singlesHraci)); setLosovano(true); }

  const efektivniTymy = useMemo((): ParEntry[] => {
    if (typ !== "turnaj") return [];
    const platniPary = pary.filter(p => p.jmeno1.trim() && p.jmeno2.trim());
    if (typParovani === "pary")    return platniPary;
    if (typParovani === "singles") return losovano ? losovanoSingles : sparujSingles(singlesHraci);
    const singPary = losovano ? losovanoSingles : sparujSingles(singlesHraci);
    return [...platniPary, ...singPary];
  }, [typ, typParovani, pary, singlesHraci, losovano, losovanoSingles]);

  const pocetSkupin = useMemo(() => vypocitejPocetSkupin(efektivniTymy.length), [efektivniTymy.length]);
  const skupiny     = useMemo(() => rozdelDoSkupin(efektivniTymy, pocetSkupin), [efektivniTymy, pocetSkupin]);

  const odhadTurnaje = useMemo(() => {
    const n = efektivniTymy.length;
    if (n < 2) return null;
    const kurty = typeof pocetKurtu === "number" ? pocetKurtu : 2;
    const minNaZapas = scoringTyp === "gamy" ? scoringLimit * 3 + 5 : odhadMinut(scoringLimit) + 5;
    const skupinaZapasy = skupiny.reduce((acc, s) => acc + (s.length * (s.length - 1)) / 2, 0);
    const playoffZapasy = playoff ? (multiTier ? n - skupiny.length : Math.ceil(n / 2)) : 0;
    const total = skupinaZapasy + playoffZapasy;
    const totalMin = Math.ceil(total / kurty) * (minNaZapas + 3);
    const h = Math.floor(totalMin / 60), m = totalMin % 60;
    return { total, text: h > 0 ? `${h}h ${m > 0 ? m + "min" : ""}` : `${m} minut` };
  }, [efektivniTymy, pocetKurtu, scoringTyp, scoringLimit, skupiny, playoff, multiTier]);

  // === Vytvoreni hry ===
  async function vytvorHru() {
    if (!typ) return;
    setStav("loading");
    setChyba("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setChyba("Musis byt prihlasen."); setStav("chyba"); return; }

    const k = typeof pocetKurtu === "number" ? pocetKurtu : 2;

    // --- AMERICANO / MEXICANO ---
    if (typ !== "turnaj") {
      const platni = hraci.filter(h => h.jmeno.trim());
      if (platni.length < 4)            { setChyba("Zadej alespon 4 hrace."); setStav("chyba"); return; }
      if (platni.length % 2 !== 0)      { setChyba("Pocet hracu musi byt sudy."); setStav("chyba"); return; }

      const { data: hra, error } = await supabase.from("hry").insert({
        nazev: nazev.trim() || `${FORMATY.find(f => f.typ === typ)?.nazev} ${new Date().toLocaleDateString("cs-CZ")}`,
        typ, stav: "probiha", created_by: user.id, pocet_kurtu: k,
        body_na_zapas: typ === "mexicano" ? minutNaKolo : bodyNaZapas,
        settings: {
          cas_od: casOd, cas_do: casDo,
          minut_na_kolo: minutNaKolo, minut_presunu: minutPresunu,
          cisla_kurtu: typ === "mexicano"
            ? cislaMexicano.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n)).sort((a, b) => a - b)
            : null,
        },
      }).select().single();

      if (error || !hra) { setChyba("Nepodarilo se vytvorit hru."); setStav("chyba"); return; }

      const { data: ucastnici } = await supabase.from("hra_ucastnici")
        .insert(platni.map(h => ({ hra_id: hra.id, jmeno: h.jmeno.trim(), user_id: null }))).select();
      if (!ucastnici) { setChyba("Nepodarilo se pridat hrace."); setStav("chyba"); return; }

      if (typ === "americano") {
        const rozpis = generujAmericano(ucastnici.map(u => ({ id: u.id, jmeno: u.jmeno })), k);
        await supabase.from("hra_zapasy").insert(rozpis.map(z => ({
          hra_id: hra.id, kolo: z.kolo, kurt: z.kurt,
          tym1_hrac1_id: z.tym1[0], tym1_hrac2_id: z.tym1[1],
          tym2_hrac1_id: z.tym2[0], tym2_hrac2_id: z.tym2[1],
          faze: "skupiny",
        })));
      }

      router.push(`/hry/${hra.id}`);
      return;
    }

    // --- TURNAJ ---
    const tymy = efektivniTymy;
    if (tymy.length < 2) { setChyba("Zadej alespon 2 tymy."); setStav("chyba"); return; }

    const { data: hra, error: hraErr } = await supabase.from("hry").insert({
      nazev: nazev.trim() || `Turnaj ${new Date().toLocaleDateString("cs-CZ")}`,
      typ: "turnaj", stav: "probiha", created_by: user.id, pocet_kurtu: k,
      body_na_zapas: null,
      settings: {
        cas_od: casOd, cas_do: casDo,
        scoring_typ: scoringTyp,
        scoring_limit: scoringLimit,
        scoring_limit_playoff: odlisnyScoring ? scoringLimitPlayoff : scoringLimit,
        playoff, typ_playoff: typPlayoff, multi_tier: multiTier,
        typ_parovani: typParovani,
      },
    }).select().single();

    if (hraErr || !hra) { setChyba("Nepodarilo se vytvorit turnaj."); setStav("chyba"); return; }

    // Vsichni individualni hraci
    const vsichniHraci = tymy.flatMap(t => [
      { hra_id: hra.id, jmeno: t.jmeno1.trim(), pohlavi: t.pohlavi1 || "neuvedeno", user_id: null },
      { hra_id: hra.id, jmeno: t.jmeno2.trim(), pohlavi: t.pohlavi2 || "neuvedeno", user_id: null },
    ]);
    const { data: ucastnici } = await supabase.from("hra_ucastnici").insert(vsichniHraci).select();
    if (!ucastnici) { setChyba("Nepodarilo se pridat hrace."); setStav("chyba"); return; }

    // Tymy (pary)
    const skupinyData = rozdelDoSkupin(tymy, pocetSkupin);
    const tymyInsert = skupinyData.flatMap((skupina, si) =>
      skupina.map((tym, ti) => {
        const h1 = ucastnici.find(u => u.jmeno === tym.jmeno1.trim());
        const h2 = ucastnici.find(u => u.jmeno === tym.jmeno2.trim());
        return {
          hra_id: hra.id,
          nazev: `${tym.jmeno1} / ${tym.jmeno2}`,
          hrac1_id: h1?.id ?? null,
          hrac2_id: h2?.id ?? null,
          skupina: SKUPINY_NAZVY[si],
          nasazeni: ti + 1,
        };
      })
    );

    const { data: createdTymy } = await supabase.from("turnaj_tymy").insert(tymyInsert).select();
    if (!createdTymy) { setChyba("Nepodarilo se vytvorit tymy."); setStav("chyba"); return; }

    // Zapasy skupin (vsechny kombinace uvnitr skupiny)
    const zapasy = skupinyData.flatMap((skupina, si) => {
      const sName = SKUPINY_NAZVY[si];
      const sTymy = createdTymy.filter(t => t.skupina === sName);
      const matches = [];
      for (let i = 0; i < sTymy.length; i++) {
        for (let j = i + 1; j < sTymy.length; j++) {
          matches.push({ hra_id: hra.id, faze: "skupina", skupina: sName, kolo: null, tym1_id: sTymy[i].id, tym2_id: sTymy[j].id, stav: "ceka" });
        }
      }
      return matches;
    });

    if (zapasy.length > 0) await supabase.from("turnaj_zapasy").insert(zapasy);

    router.push(`/hry/${hra.id}`);
  }

  const maxKrok = typ === "turnaj" ? 4 : 3;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-12" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="max-w-2xl mx-auto">

          <div className="mb-8">
            <a href="/hry" className="text-sm hover:underline" style={{ color: "#801A28" }}>Zpet na hry</a>
            <h1 className="text-2xl font-bold mt-3" style={{ color: "#801A28" }}>Nova hra</h1>
            <div className="flex gap-2 mt-4">
              {Array.from({ length: maxKrok }, (_, i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: krok > i ? "#801A28" : "#e5e7eb" }} />
              ))}
            </div>
          </div>

          {/* ===== KROK 1 — Format + parametry ===== */}
          {krok === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-base font-semibold mb-3" style={{ color: "#0A0A0A" }}>Format hry</h2>
                <div className="flex flex-col gap-3">
                  {FORMATY.map(f => (
                    <button key={f.typ} onClick={() => setTyp(f.typ)}
                      className={`text-left rounded-2xl border-2 p-5 bg-white transition-all ${typ === f.typ ? "border-[#801A28] shadow-md" : "border-zinc-200 hover:border-zinc-300"}`}>
                      <p className="font-bold mb-1" style={{ color: "#0A0A0A" }}>{f.nazev}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{f.popis}</p>
                    </button>
                  ))}
                </div>
              </div>

              {typ && (
                <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col gap-5">

                  {/* Pocet hracu — americano/mexicano */}
                  {typ !== "turnaj" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium" style={{ color: "#374151" }}>Pocet hracu</label>
                      <input type="number" min={4} max={256} value={pocetHracu}
                        onChange={e => { const n = parseInt(e.target.value); if (!isNaN(n)) nastavPocetHracu(n); else setPocetHracu(""); }}
                        className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                      <p className="text-xs" style={{ color: "#9ca3af" }}>Minimum 4, vzdy sudy pocet.</p>
                    </div>
                  )}

                  {/* Pocet kurtu */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: "#374151" }}>Pocet kurtu</label>
                    <input type="number" min={1} max={20} value={pocetKurtu}
                      onChange={e => {
                        const n = parseInt(e.target.value);
                        if (!isNaN(n)) { setPocetKurtu(n); if (typ === "mexicano") setCislaMexicano(Array.from({ length: n }, (_, i) => i + 1).join(", ")); }
                        else setPocetKurtu("");
                      }}
                      className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                  </div>

                  {/* Cas k dispozici */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: "#374151" }}>Cas k dispozici</label>
                    <div className="flex items-center gap-3">
                      <input type="time" value={casOd} onChange={e => setCasOd(e.target.value)} className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                      <span style={{ color: "#9ca3af" }}>–</span>
                      <input type="time" value={casDo} onChange={e => setCasDo(e.target.value)} className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                    </div>
                  </div>

                  {/* Americano — body */}
                  {typ === "americano" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium" style={{ color: "#374151" }}>Body na zapas</label>
                      <div className="flex gap-2 items-center">
                        {[16, 24, 32].map(b => (
                          <button key={b} onClick={() => setBodyNaZapas(b)}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all ${bodyNaZapas === b ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                            {b}
                          </button>
                        ))}
                        <input type="number" min={8} max={99} value={bodyNaZapas} onChange={e => setBodyNaZapas(Number(e.target.value))}
                          className="w-16 rounded-xl border-2 border-zinc-200 px-2 py-2.5 text-sm text-center focus:outline-none" />
                      </div>
                      <p className="text-xs" style={{ color: "#9ca3af" }}>{bodyNaZapas} bodu = cca {odhadMinut(bodyNaZapas)} minut na zapas</p>
                    </div>
                  )}

                  {/* Mexicano */}
                  {typ === "mexicano" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Cisla kurtu (oddelena carkou)</label>
                        <input type="text" value={cislaMexicano} onChange={e => {
                          setCislaMexicano(e.target.value);
                          const c = e.target.value.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                          if (c.length > 0) setPocetKurtu(c.length);
                        }} className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Minut na kolo</label>
                        <div className="flex gap-2 items-center">
                          {[10, 12, 15].map(m => (
                            <button key={m} onClick={() => setMinutNaKolo(m)}
                              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all ${minutNaKolo === m ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                              {m} min
                            </button>
                          ))}
                          <input type="number" min={5} max={30} value={minutNaKolo} onChange={e => setMinutNaKolo(Number(e.target.value))}
                            className="w-16 rounded-xl border-2 border-zinc-200 px-2 py-2.5 text-sm text-center focus:outline-none" />
                        </div>
                        {(() => {
                          const [hOd, mOd] = casOd.split(":").map(Number);
                          const [hDo, mDo] = casDo.split(":").map(Number);
                          const celkem = (hDo * 60 + mDo) - (hOd * 60 + mOd);
                          if (celkem <= 0) return null;
                          const maxKol = Math.floor(celkem / (minutNaKolo + minutPresunu));
                          return <p className="text-xs" style={{ color: "#9ca3af" }}>{minutNaKolo} + {minutPresunu} min/kolo → max <strong>{maxKol} kol</strong> za {celkem} min</p>;
                        })()}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Cas na presun (min)</label>
                        <div className="flex gap-2 items-center">
                          {[2, 3, 5].map(m => (
                            <button key={m} onClick={() => setMinutPresunu(m)}
                              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all ${minutPresunu === m ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                              {m} min
                            </button>
                          ))}
                          <input type="number" min={1} max={15} value={minutPresunu} onChange={e => setMinutPresunu(Number(e.target.value))}
                            className="w-16 rounded-xl border-2 border-zinc-200 px-2 py-2.5 text-sm text-center focus:outline-none" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Turnaj — nastaveni */}
                  {typ === "turnaj" && (
                    <>
                      {/* Typ parovani */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Typ parovani</label>
                        <div className="flex gap-2">
                          {(["pary", "singles", "mix"] as const).map(t => (
                            <button key={t} onClick={() => setTypParovani(t)}
                              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all ${typParovani === t ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                              {t === "pary" ? "Pary" : t === "singles" ? "Jednotlivci" : "Mix"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Pocet */}
                      {typParovani === "mix" ? (
                        <div className="flex gap-3">
                          <div className="flex flex-col gap-1.5 flex-1">
                            <label className="text-sm font-medium" style={{ color: "#374151" }}>Pocet hotovych paru</label>
                            <input type="number" min={0} max={128} value={pocetTymu}
                              onChange={e => { const n = parseInt(e.target.value); if (!isNaN(n)) nastavPocetTymu(n); else setPocetTymu(""); }}
                              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                          </div>
                          <div className="flex flex-col gap-1.5 flex-1">
                            <label className="text-sm font-medium" style={{ color: "#374151" }}>Pocet jednotlivcu</label>
                            <input type="number" min={0} max={256} value={pocetSinglesHracu}
                              onChange={e => { const n = parseInt(e.target.value); if (!isNaN(n)) nastavPocetSingles(n); else setPocetSinglesHracu(""); }}
                              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium" style={{ color: "#374151" }}>
                            {typParovani === "pary" ? "Pocet paru" : "Pocet hracu"}
                          </label>
                          <div className="flex items-center gap-3">
                            <input type="number" min={2} max={typParovani === "pary" ? 128 : 256} value={typParovani === "pary" ? pocetTymu : pocetSinglesHracu}
                              onChange={e => {
                                const n = parseInt(e.target.value);
                                if (!isNaN(n)) typParovani === "pary" ? nastavPocetTymu(n) : nastavPocetSingles(n);
                                else typParovani === "pary" ? setPocetTymu("") : setPocetSinglesHracu("");
                              }}
                              className="w-24 rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                            <p className="text-sm flex-1" style={{ color: "#6b7280" }}>
                              {typParovani === "pary" && typeof pocetTymu === "number" && pocetTymu > 0
                                ? `= ${pocetTymu * 2} hracu · ${vypocitejPocetSkupin(pocetTymu)} ${(() => { const n = vypocitejPocetSkupin(pocetTymu); return n === 1 ? "skupina" : n < 5 ? "skupiny" : "skupin"; })()}`
                                : typParovani === "singles" && typeof pocetSinglesHracu === "number" && pocetSinglesHracu > 0
                                ? `= ${Math.floor(pocetSinglesHracu / 2)} paru · ${vypocitejPocetSkupin(Math.floor(pocetSinglesHracu / 2))} ${(() => { const n = vypocitejPocetSkupin(Math.floor(pocetSinglesHracu / 2)); return n === 1 ? "skupina" : n < 5 ? "skupiny" : "skupin"; })()}${pocetSinglesHracu % 2 !== 0 ? " · 1 volno" : ""}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      )}
                      {typParovani === "mix" && (() => {
                        const celkem = (typeof pocetTymu === "number" ? pocetTymu : 0) + Math.floor((typeof pocetSinglesHracu === "number" ? pocetSinglesHracu : 0) / 2);
                        return celkem > 0 ? (
                          <p className="text-xs" style={{ color: "#9ca3af" }}>
                            Celkem {celkem} paru = {celkem * 2} hracu · {vypocitejPocetSkupin(celkem)} {(() => { const n = vypocitejPocetSkupin(celkem); return n === 1 ? "skupina" : n < 5 ? "skupiny" : "skupin"; })()}
                          </p>
                        ) : null;
                      })()}

                      {/* Format zapasu */}
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Format zapasu</label>
                        <div className="flex gap-2">
                          {(["gamy", "body", "cas"] as const).map(t => (
                            <button key={t} onClick={() => { setScoringTyp(t); setScoringLimit(t === "gamy" ? 6 : t === "body" ? 24 : 12); }}
                              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all ${scoringTyp === t ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                              {t === "gamy" ? "Gamy" : t === "body" ? "Body" : "Cas"}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs shrink-0" style={{ color: "#6b7280" }}>
                            {scoringTyp === "gamy" ? "Gamy na zapas:" : scoringTyp === "body" ? "Body na zapas:" : "Minut na zapas:"}
                          </label>
                          <div className="flex gap-1.5 flex-1">
                            {(scoringTyp === "gamy" ? [4, 5, 6] : scoringTyp === "body" ? [16, 24, 32] : [10, 12, 15]).map(n => (
                              <button key={n} onClick={() => setScoringLimit(n)}
                                className={`flex-1 rounded-lg py-2 text-sm font-semibold border-2 transition-all ${scoringLimit === n ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                                {n}
                              </button>
                            ))}
                            <input type="number" min={1} max={99} value={scoringLimit} onChange={e => setScoringLimit(Number(e.target.value))}
                              className="w-14 rounded-lg border-2 border-zinc-200 px-2 py-2 text-sm text-center focus:outline-none" />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "#6b7280" }}>
                          <input type="checkbox" checked={odlisnyScoring} onChange={e => setOdlisnyScoring(e.target.checked)} className="rounded" />
                          Jiny format pro playoff
                        </label>
                        {odlisnyScoring && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs shrink-0" style={{ color: "#6b7280" }}>Playoff:</label>
                            <div className="flex gap-1.5 flex-1">
                              {(scoringTyp === "gamy" ? [4, 5, 6] : scoringTyp === "body" ? [16, 24, 32] : [10, 12, 15]).map(n => (
                                <button key={n} onClick={() => setScoringLimitPlayoff(n)}
                                  className={`flex-1 rounded-lg py-2 text-sm font-semibold border-2 transition-all ${scoringLimitPlayoff === n ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                                  {n}
                                </button>
                              ))}
                              <input type="number" min={1} max={99} value={scoringLimitPlayoff} onChange={e => setScoringLimitPlayoff(Number(e.target.value))}
                                className="w-14 rounded-lg border-2 border-zinc-200 px-2 py-2 text-sm text-center focus:outline-none" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Playoff */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Playoff</label>
                        <div className="flex gap-2">
                          <button onClick={() => setPlayoff(true)}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all ${playoff ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                            Ano
                          </button>
                          <button onClick={() => setPlayoff(false)}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all ${!playoff ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                            Ne — jen skupiny
                          </button>
                        </div>
                        {playoff && <p className="text-xs" style={{ color: "#9ca3af" }}>Typ playoff a pavouk se nastavi az pri zahajeni playoff.</p>}
                      </div>
                    </>
                  )}
                </div>
              )}

              <button onClick={() => setKrok(2)} disabled={!typ}
                className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: "#801A28" }}>
                Pokracovat
              </button>
            </div>
          )}

          {/* ===== KROK 2 — Nazev ===== */}
          {krok === 2 && (
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-zinc-100 p-6">
                <label className="text-sm font-medium block mb-2" style={{ color: "#374151" }}>Nazev hry (volitelne)</label>
                <input type="text" value={nazev} onChange={e => setNazev(e.target.value)}
                  placeholder={`${FORMATY.find(f => f.typ === typ)?.nazev} ${new Date().toLocaleDateString("cs-CZ")}`}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setKrok(1)} className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-300 bg-white" style={{ color: "#374151" }}>Zpet</button>
                <button onClick={() => setKrok(3)} className="flex-1 rounded-full py-3 text-sm font-semibold text-white" style={{ backgroundColor: "#801A28" }}>Pokracovat</button>
              </div>
            </div>
          )}

          {/* ===== KROK 3 — Hraci (americano/mexicano) ===== */}
          {krok === 3 && typ !== "turnaj" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold mb-1" style={{ color: "#0A0A0A" }}>Pridej hrace</h2>
                <p className="text-sm" style={{ color: "#6b7280" }}>{hraci.length} hracu · hosty staci zadat jmenem</p>
              </div>
              <div className="flex flex-col gap-2">
                {hraci.map((h, i) => (
                  <div key={i} className="bg-white rounded-xl border border-zinc-100 p-4 flex gap-3 items-center">
                    <span className="text-sm font-bold w-6 text-center shrink-0" style={{ color: "#9ca3af" }}>{i + 1}</span>
                    <input type="text" placeholder="Jmeno" value={h.jmeno} onChange={e => updateHrac(i, "jmeno", e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                    <input type="email" placeholder="E-mail (nepovinne)" value={h.email} onChange={e => updateHrac(i, "email", e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                    {hraci.length > 4 && (
                      <button onClick={() => odeberHrace(i)} className="text-zinc-400 hover:text-red-500 text-xl leading-none px-1">x</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={pridejHrace}
                className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm font-medium hover:border-[#801A28] transition-colors"
                style={{ color: "#6b7280" }}>
                Pridat hrace
              </button>
              {chyba && <p className="text-sm text-center" style={{ color: "#801A28" }}>{chyba}</p>}
              <div className="flex gap-3">
                <button onClick={() => setKrok(2)} className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-300 bg-white" style={{ color: "#374151" }}>Zpet</button>
                <button onClick={vytvorHru} disabled={stav === "loading"}
                  className="flex-1 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: "#801A28" }}>
                  {stav === "loading" ? "Vytvarim..." : "Spustit hru"}
                </button>
              </div>
            </div>
          )}

          {/* ===== KROK 3 — Tymy / hraci pro turnaj ===== */}
          {krok === 3 && typ === "turnaj" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-semibold mb-1" style={{ color: "#0A0A0A" }}>
                  {typParovani === "pary" ? "Zadej pary" : typParovani === "singles" ? "Zadej hrace" : "Zadej pary a jednotlivce"}
                </h2>
                <p className="text-sm" style={{ color: "#6b7280" }}>Max 128 paru · pohlavni M/Z je volitelne (pomaha pri losovani)</p>
              </div>

              {/* Pary */}
              {(typParovani === "pary" || typParovani === "mix") && (
                <div className="flex flex-col gap-3">
                  {typParovani === "mix" && <p className="text-xs font-semibold" style={{ color: "#374151" }}>Hotove pary:</p>}
                  {pary.map((p, i) => (
                    <div key={p.id} className="bg-white rounded-xl border border-zinc-100 p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold" style={{ color: "#9ca3af" }}>Par {i + 1}</span>
                        {pary.length > 2 && <button onClick={() => odeberPar(p.id)} className="text-xs" style={{ color: "#9ca3af" }}>odebrat</button>}
                      </div>
                      <div className="flex gap-3">
                        <div className="flex flex-col gap-1 flex-1">
                          <input type="text" placeholder="Hrac 1" value={p.jmeno1} onChange={e => updatePar(p.id, "jmeno1", e.target.value)}
                            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                          <div className="flex gap-1">
                            {[{ v: "m", l: "M" }, { v: "z", l: "Z" }].map(g => (
                              <button key={g.v} onClick={() => updatePar(p.id, "pohlavi1", p.pohlavi1 === g.v ? "" : g.v)}
                                className={`flex-1 rounded-lg py-1 text-xs font-semibold border transition-all ${p.pohlavi1 === g.v ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-500"}`}>
                                {g.l}
                              </button>
                            ))}
                          </div>
                        </div>
                        <span className="self-center text-sm" style={{ color: "#9ca3af" }}>/</span>
                        <div className="flex flex-col gap-1 flex-1">
                          <input type="text" placeholder="Hrac 2" value={p.jmeno2} onChange={e => updatePar(p.id, "jmeno2", e.target.value)}
                            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                          <div className="flex gap-1">
                            {[{ v: "m", l: "M" }, { v: "z", l: "Z" }].map(g => (
                              <button key={g.v} onClick={() => updatePar(p.id, "pohlavi2", p.pohlavi2 === g.v ? "" : g.v)}
                                className={`flex-1 rounded-lg py-1 text-xs font-semibold border transition-all ${p.pohlavi2 === g.v ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-500"}`}>
                                {g.l}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pary.length < 128 && (
                    <button onClick={pridejPar}
                      className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm font-medium hover:border-[#801A28] transition-colors"
                      style={{ color: "#6b7280" }}>
                      Pridat par
                    </button>
                  )}
                </div>
              )}

              {/* Singles */}
              {(typParovani === "singles" || typParovani === "mix") && (
                <div className="flex flex-col gap-3">
                  {typParovani === "mix" && <p className="text-xs font-semibold mt-2" style={{ color: "#374151" }}>Jednotlivci (dolosovani):</p>}
                  {singlesHraci.map((s, i) => (
                    <div key={s.id} className="bg-white rounded-xl border border-zinc-100 p-4 flex gap-3 items-center">
                      <span className="text-sm font-bold w-5 shrink-0" style={{ color: "#9ca3af" }}>{i + 1}</span>
                      <input type="text" placeholder="Jmeno hrace" value={s.jmeno} onChange={e => updateSingle(s.id, "jmeno", e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                      <div className="flex gap-1 shrink-0">
                        {[{ v: "m", l: "M" }, { v: "z", l: "Z" }].map(g => (
                          <button key={g.v} onClick={() => updateSingle(s.id, "pohlavi", s.pohlavi === g.v ? "" : g.v)}
                            className={`w-9 rounded-lg py-2 text-xs font-semibold border transition-all ${s.pohlavi === g.v ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-500"}`}>
                            {g.l}
                          </button>
                        ))}
                      </div>
                      {singlesHraci.length > 2 && (
                        <button onClick={() => odeberSingle(s.id)} className="text-zinc-400 hover:text-red-500 text-xl leading-none">x</button>
                      )}
                    </div>
                  ))}
                  <button onClick={pridejSingle}
                    className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm font-medium hover:border-[#801A28] transition-colors"
                    style={{ color: "#6b7280" }}>
                    Pridat hrace
                  </button>

                  {singlesHraci.filter(s => s.jmeno.trim()).length >= 2 && (
                    <div className="rounded-xl p-4" style={{ backgroundColor: "#F2EDE4" }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold" style={{ color: "#801A28" }}>
                          {losovano ? "Vylosovane pary:" : "Losovani paru"}
                        </p>
                        <button onClick={losuj} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: "#801A28" }}>
                          {losovano ? "Losovat znovu" : "Losovat"}
                        </button>
                      </div>
                      {losovano
                        ? losovanoSingles.map((p, i) => (
                            <p key={p.id} className="text-xs py-0.5" style={{ color: "#374151" }}>{i + 1}. {p.jmeno1} / {p.jmeno2}</p>
                          ))
                        : <p className="text-xs" style={{ color: "#9ca3af" }}>Prednostne sparuje M+Z, zbytek nahodne.</p>
                      }
                    </div>
                  )}
                </div>
              )}

              {chyba && <p className="text-sm text-center" style={{ color: "#801A28" }}>{chyba}</p>}

              <div className="flex gap-3">
                <button onClick={() => setKrok(2)} className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-300 bg-white" style={{ color: "#374151" }}>Zpet</button>
                <button onClick={() => {
                  if (efektivniTymy.length < 2) { setChyba("Zadej alespon 2 pary."); return; }
                  setChyba(""); setKrok(4);
                }} className="flex-1 rounded-full py-3 text-sm font-semibold text-white" style={{ backgroundColor: "#801A28" }}>
                  Pokracovat
                </button>
              </div>
            </div>
          )}

          {/* ===== KROK 4 — Skupiny + souhrn (turnaj) ===== */}
          {krok === 4 && typ === "turnaj" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-semibold mb-1" style={{ color: "#0A0A0A" }}>Skupiny a souhrn</h2>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  {efektivniTymy.length} tymu · {skupiny.length} {skupiny.length === 1 ? "skupina" : skupiny.length < 5 ? "skupiny" : "skupin"}
                  {playoff ? " · playoff" : " · jen skupiny"}
                </p>
              </div>

              {skupiny.map((skupina, si) => (
                <div key={si} className="bg-white rounded-2xl border border-zinc-100 p-5">
                  <p className="text-xs font-bold mb-3" style={{ color: "#801A28" }}>Skupina {SKUPINY_NAZVY[si]}</p>
                  <div className="flex flex-col gap-1.5">
                    {skupina.map((tym, ti) => (
                      <div key={tym.id} className="flex items-center gap-2 text-sm">
                        <span className="w-4 shrink-0" style={{ color: "#9ca3af" }}>{ti + 1}.</span>
                        <span className="font-medium" style={{ color: "#0A0A0A" }}>{tym.jmeno1}</span>
                        <span style={{ color: "#9ca3af" }}>/</span>
                        <span className="font-medium" style={{ color: "#0A0A0A" }}>{tym.jmeno2}</span>
                        {(tym.pohlavi1 || tym.pohlavi2) && (
                          <span className="text-xs" style={{ color: "#d1d5db" }}>({tym.pohlavi1 || "?"}/{tym.pohlavi2 || "?"})</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-3" style={{ color: "#9ca3af" }}>
                    {(skupina.length * (skupina.length - 1)) / 2} zapasu · kazdy s kazdym
                  </p>
                </div>
              ))}

              <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex flex-col gap-1.5">
                <p className="text-sm font-semibold mb-1" style={{ color: "#0A0A0A" }}>Souhrn</p>
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  Scoring: {scoringTyp === "gamy" ? `gamy do ${scoringLimit}` : `${scoringLimit} bodu na zapas`}
                  {odlisnyScoring ? ` · playoff: ${scoringTyp === "gamy" ? `do ${scoringLimitPlayoff}` : `${scoringLimitPlayoff} b`}` : ""}
                </p>
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  Playoff: {playoff
                    ? `ano — ${typPlayoff === "krizovy" ? "krizovy (1A vs 2B)" : "primy (1 vs 4, 2 vs 3)"}${multiTier ? " · vice pasem" : ""}`
                    : "ne — jen skupiny"}
                </p>
                {odhadTurnaje && (
                  <p className="text-xs" style={{ color: "#6b7280" }}>
                    Odhad: <strong>{odhadTurnaje.text}</strong> ({odhadTurnaje.total} zapasu celkem)
                  </p>
                )}
              </div>

              {chyba && <p className="text-sm text-center" style={{ color: "#801A28" }}>{chyba}</p>}

              <div className="flex gap-3">
                <button onClick={() => setKrok(3)} className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-300 bg-white" style={{ color: "#374151" }}>Zpet</button>
                <button onClick={vytvorHru} disabled={stav === "loading"}
                  className="flex-1 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: "#801A28" }}>
                  {stav === "loading" ? "Vytvarim..." : "Spustit turnaj"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
