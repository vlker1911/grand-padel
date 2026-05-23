"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { generujAmericano } from "@/lib/americano";
import { generujRozvrh, type TurnajFormat, type TymVeSkupine, type Rozvrh } from "@/lib/turnaj-format";
import { rozdelSeSeedingem as rozdelSeSeedingemLib } from "@/lib/turnaj-postup";

type Typ = "americano" | "mexicano" | "turnaj";

const FORMATY: { typ: Typ; nazev: string; popis: string }[] = [
  { typ: "americano", nazev: "Americano", popis: "Rotujici pary, individualni skore. Kazdy hraje s kazdym." },
  { typ: "mexicano", nazev: "Mexicano", popis: "Hraci se presouvaji po kurtech podle vysledku. Hraje se na cas." },
  { typ: "turnaj",   nazev: "Turnaj",    popis: "Skupiny + volitelny playoff. Pary nebo jednotlivci. Body nebo gamy." },
];

type HracEntry = { jmeno: string; email: string };
type ParEntry  = { id: number; nazevTymu: string; jmeno1: string; pohlavi1: string; jmeno2: string; pohlavi2: string; nasazeni?: number | null };
type SingEntry = { id: number; jmeno: string; pohlavi: string };

const SKUPINY_NAZVY = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function odhadMinut(body: number) {
  if (body === 16) return 8;
  if (body === 24) return 12;
  if (body === 32) return 15;
  return Math.round(body * 0.45);
}

// ===== Wizard / kalkulator variant =====

type WizardScoringTyp = "gamy" | "body" | "cas" | "sety";
type WizardPlayoffMode = "bez" | "medaile" | "vitez" | "umisteni" | "skupiny_o_umisteni";
type WizardVitezBracket = "auto" | "top4" | "top8" | "top16";

type WizardInput = {
  pocetTymu: number;
  pocetKurtu: number;
  casOdMin: number;
  casDoMin: number;
  scoringTyp: WizardScoringTyp;
  scoringLimit: number;  // pro cas se predpoklada autoKolo (0 = spocti)
  playoffMode: WizardPlayoffMode;
  vitezBracket?: WizardVitezBracket;
  bezSkupin?: boolean;   // pokud true, preskoci skupinovou fazi
};

type WizardVariant = WizardInput & {
  zapasuSkupiny: number;
  zapasuPlayoff: number;
  totalZapasu: number;
  minNaZapas: number;
  totalMin: number;
  celkemMinut: number;
  fits: boolean;
  rezerva: number;
  pocetSkupin: number;
  scoringDelkaKola?: number;  // pro cas — vypoctena delka kola
  scoringInvalid?: boolean;   // pro cas — kdyz delka kola < 10
};

function calculateWizardVariant(input: WizardInput): WizardVariant {
  const n = input.pocetTymu;
  const pocetSkupin = input.bezSkupin ? 0 : vypocitejPocetSkupin(n);
  let zapasuSkupiny = 0;
  if (!input.bezSkupin) {
    const baseSize = Math.floor(n / pocetSkupin);
    const extra = n % pocetSkupin;
    for (let i = 0; i < pocetSkupin; i++) {
      const size = baseSize + (i < extra ? 1 : 0);
      zapasuSkupiny += (size * (size - 1)) / 2;
    }
  }
  // Playoff zapasy
  let zapasuPlayoff = 0;
  if (input.playoffMode === "umisteni") {
    const pocetPasem = Math.ceil(n / 4);
    for (let p = 0; p < pocetPasem; p++) {
      const tymyPasma = Math.min(4, n - p * 4);
      if (tymyPasma === 4) zapasuPlayoff += 4;
      else if (tymyPasma === 3) zapasuPlayoff += 1;
      else if (tymyPasma === 2) zapasuPlayoff += 1;
    }
  } else if (input.playoffMode === "vitez") {
    let bracketSize: number;
    const vb = input.vitezBracket ?? "auto";
    if (vb === "top4") bracketSize = 4;
    else if (vb === "top8") bracketSize = 8;
    else if (vb === "top16") bracketSize = 16;
    else { bracketSize = 2; while (bracketSize * 2 <= n && bracketSize < 16) bracketSize *= 2; }
    while (bracketSize > n && bracketSize > 2) bracketSize /= 2;
    zapasuPlayoff = bracketSize - 1;
  } else if (input.playoffMode === "medaile") {
    zapasuPlayoff = n >= 4 ? 4 : (n >= 2 ? 1 : 0);
  } else if (input.playoffMode === "skupiny_o_umisteni" && !input.bezSkupin) {
    // Druha faze: horni + dolni polovina, round-robin v kazde
    const horniVel = Math.ceil(n / 2);
    const dolniVel = n - horniVel;
    zapasuPlayoff = (horniVel * (horniVel - 1)) / 2 + (dolniVel * (dolniVel - 1)) / 2;
  }

  const totalZapasu = zapasuSkupiny + zapasuPlayoff;
  const celkemMinut = input.casDoMin - input.casOdMin;

  // Pro cas format spocti delku kola automaticky
  let minNaZapas: number;
  let scoringDelkaKola: number | undefined;
  let scoringInvalid = false;
  if (input.scoringTyp === "cas") {
    const kol = Math.ceil(totalZapasu / input.pocetKurtu);
    if (kol > 0 && celkemMinut > 0) {
      const delkaKola = Math.floor((celkemMinut - (kol - 1) * 3) / kol);
      scoringDelkaKola = Math.max(10, Math.min(60, delkaKola));
      scoringInvalid = delkaKola < 10;
      minNaZapas = scoringDelkaKola + 3;
    } else {
      minNaZapas = 13;  // default
      scoringInvalid = true;
    }
  } else if (input.scoringTyp === "gamy") {
    minNaZapas = input.scoringLimit * 3 + 5;
  } else {
    minNaZapas = odhadMinut(input.scoringLimit) + 5;
  }

  // Cas potreba: per faze (skupiny + playoff)
  function casZaZapasy(z: number): number {
    if (z === 0) return 0;
    const k = Math.ceil(z / input.pocetKurtu);
    return k * minNaZapas + (k - 1) * 3;
  }
  const minSk = casZaZapasy(zapasuSkupiny);
  const minPl = casZaZapasy(zapasuPlayoff);
  const prechodMeziFazemi = (zapasuSkupiny > 0 && zapasuPlayoff > 0) ? 3 : 0;
  const totalMin = minSk + minPl + prechodMeziFazemi;

  const fits = !scoringInvalid && totalMin <= celkemMinut;
  const rezerva = celkemMinut - totalMin;

  return {
    ...input,
    zapasuSkupiny, zapasuPlayoff, totalZapasu,
    minNaZapas, totalMin, celkemMinut,
    fits, rezerva, pocetSkupin,
    scoringDelkaKola, scoringInvalid,
  };
}

// Generuje varianty. Wizard navrhuje jen gamy a cas (body nikdy — neni typicke pro turnaje).
// scoringFilter: "gamy" = jen gamy, "cas" = jen cas, "vse" = obojí.
// maxKurtu: omezi navrhovane varianty na <= max kurtu (default 10).
// playoffFilter: "ano" = jen s playoff, "ne" = jen bez playoff, "vse" = obojí.
// strukturaFilter: "vse" / "skupiny" (jen se skupinami) / "bezSkupin" (jen playoff).
function generateWizardVariants(
  baseInput: { pocetTymu: number; casOdMin: number; casDoMin: number },
  scoringFilter: "gamy" | "cas" | "vse" = "vse",
  maxKurtu: number = 10,
  playoffFilter: "vse" | "ano" | "ne" | "umisteni" = "vse",
  strukturaFilter: "vse" | "skupiny" | "bezSkupin" = "vse",
  gamyFilter: "vse" | 4 | 5 | 6 = "vse",
): WizardVariant[] {
  const variants: WizardVariant[] = [];
  const kurtyOptions = [1, 2, 3, 4, 5, 6, 8, 10].filter(k => k <= maxKurtu);
  const allModes: WizardPlayoffMode[] = ["umisteni", "skupiny_o_umisteni", "vitez", "medaile", "bez"];
  const playoffModes: WizardPlayoffMode[] =
    playoffFilter === "ano"      ? allModes.filter(m => m !== "bez") :
    playoffFilter === "ne"       ? ["bez"] :
    playoffFilter === "umisteni" ? ["umisteni", "skupiny_o_umisteni"] :
    allModes;
  const vitezBrackets: WizardVitezBracket[] = ["auto", "top4", "top8", "top16"];
  const gamyLimits: number[] = gamyFilter === "vse" ? [4, 5, 6] : [gamyFilter];
  const strukturyKZkouseni: boolean[] =
    strukturaFilter === "skupiny"   ? [false] :
    strukturaFilter === "bezSkupin" ? [true] :
    [false, true];

  for (const bezSk of strukturyKZkouseni) {
    for (const kurty of kurtyOptions) {
      for (const playoffMode of playoffModes) {
        // Bez skupin a bez playoff = nulovy turnaj — preskocime
        if (bezSk && playoffMode === "bez") continue;
        // Skupiny o umisteni vyzaduji skupinovou fazi
        if (bezSk && playoffMode === "skupiny_o_umisteni") continue;
        const bracketsToTry: (WizardVitezBracket | undefined)[] = playoffMode === "vitez" ? vitezBrackets : [undefined];
        for (const vb of bracketsToTry) {
          if (scoringFilter === "cas" || scoringFilter === "vse") {
            variants.push(calculateWizardVariant({
              pocetTymu: baseInput.pocetTymu, pocetKurtu: kurty,
              casOdMin: baseInput.casOdMin, casDoMin: baseInput.casDoMin,
              scoringTyp: "cas", scoringLimit: 0,
              playoffMode, vitezBracket: vb, bezSkupin: bezSk,
            }));
          }
          if (scoringFilter === "gamy" || scoringFilter === "vse") {
            for (const lim of gamyLimits) {
              variants.push(calculateWizardVariant({
                pocetTymu: baseInput.pocetTymu, pocetKurtu: kurty,
                casOdMin: baseInput.casOdMin, casDoMin: baseInput.casDoMin,
                scoringTyp: "gamy", scoringLimit: lim,
                playoffMode, vitezBracket: vb, bezSkupin: bezSk,
              }));
            }
          }
        }
      }
    }
  }
  return variants;
}

// Vrati az `limit` doporuceni v poradi: 2x optimalni, 2x max zapasu, 2x s rezervou
// (pokud nejsou duplicity). Pak doplni dalsi unikatni.
function pickWizardRecommendations(variants: WizardVariant[], limit: number = 6): WizardVariant[] {
  const fits = variants.filter(v => v.fits);
  if (fits.length === 0) return [];

  const optimalni = [...fits].sort((a, b) => {
    const aIdeal = Math.abs(a.rezerva - 20);
    const bIdeal = Math.abs(b.rezerva - 20);
    if (aIdeal !== bIdeal) return aIdeal - bIdeal;
    return b.totalZapasu - a.totalZapasu;
  });
  const nejvice = [...fits].sort((a, b) =>
    b.totalZapasu - a.totalZapasu || a.pocetKurtu - b.pocetKurtu,
  );
  const sRezervou = [...fits].sort((a, b) =>
    b.rezerva - a.rezerva || a.totalZapasu - b.totalZapasu,
  );

  // Klic pro unikatnost: scoring + limit + playoffMode + bracket + pocetKurtu + bezSkupin
  const klic = (v: WizardVariant) =>
    `${v.scoringTyp}-${v.scoringLimit}-${v.playoffMode}-${v.vitezBracket ?? ""}-${v.pocetKurtu}-${v.bezSkupin ? "ns" : "s"}`;

  const vysledek: WizardVariant[] = [];
  const seen = new Set<string>();
  function pridej(v: WizardVariant | undefined, tag: string) {
    if (!v) return;
    const k = klic(v);
    if (seen.has(k)) return;
    seen.add(k);
    (v as WizardVariant & { _tag?: string })._tag = tag;
    vysledek.push(v);
  }

  // Interleave: 1 optimalni, 1 nejvice, 1 s rezervou, opakovat
  let i = 0;
  while (vysledek.length < limit) {
    const stary = vysledek.length;
    pridej(optimalni[i], "optimalni");
    if (vysledek.length >= limit) break;
    pridej(nejvice[i], "nejvice");
    if (vysledek.length >= limit) break;
    pridej(sRezervou[i], "rezerva");
    i++;
    if (vysledek.length === stary) break; // nic noveho — vse vycerpano
  }
  return vysledek;
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
    result.push({ id: id++, nazevTymu: "", jmeno1: muzi[i].jmeno, pohlavi1: "m", jmeno2: zeny[i].jmeno, pohlavi2: "z" });
  }
  const zbyvajici = [...muzi.slice(minMix), ...zeny.slice(minMix), ...ostatni].sort(() => Math.random() - 0.5);
  for (let i = 0; i + 1 < zbyvajici.length; i += 2) {
    result.push({ id: id++, nazevTymu: "", jmeno1: zbyvajici[i].jmeno, pohlavi1: zbyvajici[i].pohlavi, jmeno2: zbyvajici[i + 1].jmeno, pohlavi2: zbyvajici[i + 1].pohlavi });
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

// Fisher-Yates shuffle (deterministicky bez seedu)
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rozdelDoSkupin(tymy: ParEntry[], numSkupin: number): ParEntry[][] {
  const groups: ParEntry[][] = Array.from({ length: numSkupin }, () => []);
  // Snake-style distribuce (po zamichani je to OK — kazda skupina dostane podobny prumer poradi)
  tymy.forEach((t, i) => groups[i % numSkupin].push(t));
  return groups;
}

// Pot system (seeding) — implementace v lib/turnaj-postup.ts.
// Tady jen tenký wrapper s ParEntry typem.
function rozdelSeSeedingem(tymy: ParEntry[], numSkupin: number): ParEntry[][] {
  return rozdelSeSeedingemLib(tymy, numSkupin);
}

export default function NovaHraPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [authStav, setAuthStav] = useState<"checking" | "auth" | "noauth">("checking");
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthStav(user ? "auth" : "noauth");
      if (!user) router.replace("/prihlaseni");
    });
  }, [supabase, router]);

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
  const [pouzitNazvyTymu,    setPouzitNazvyTymu]    = useState(false);
  const [pocetTymu,          setPocetTymu]          = useState<number | "">(8);
  const [pocetSinglesHracu,  setPocetSinglesHracu]  = useState<number | "">(8);
  const [scoringTyp,         setScoringTyp]         = useState<"gamy" | "body" | "cas" | "sety">("gamy");
  const [scoringLimit,       setScoringLimit]       = useState(4);
  const [scoringLimitPlayoff,setScoringLimitPlayoff]= useState(6);
  const [gamyTiebreak,       setGamyTiebreak]       = useState<"sudden_death" | "advantage">("sudden_death");
  const [odlisnyScoring,     setOdlisnyScoring]     = useState(false);
  // playoffMode nahrazuje: playoff (bool), multiTier (bool), typPlayoff (krizovy/primy)
  const [playoffMode,        setPlayoffMode]        = useState<"bez" | "medaile" | "vitez" | "umisteni" | "skupiny_o_umisteni">("umisteni");
  const [vitezBracket,       setVitezBracket]       = useState<"auto" | "top4" | "top8" | "top16">("auto");
  const [rezimKurtu,         setRezimKurtu]         = useState<"auto" | "1-1" | "2-1">("auto");
  const [utechovyPavouk,     setUtechovyPavouk]     = useState(false);
  const [bezSkupin,          setBezSkupin]          = useState(false);
  const [placementBracket,   setPlacementBracket]   = useState(false);
  // Postupový klíč: kdo postupuje do hlavního/útěchového bracketu (jen pro vitez mod se skupinami)
  const [klicHlavniN,        setKlicHlavniN]        = useState<number>(0); // 0 = neaktivni
  const [klicUtechOd,        setKlicUtechOd]        = useState<number>(0); // 0 = neaktivni
  const [klicUtechDo,        setKlicUtechDo]        = useState<number>(0);
  const [pointRule,          setPointRule]          = useState<"golden" | "star" | "advantage">("star");
  // Konfigurace pro scoringTyp === "sety"
  const [setyVitezne,        setSetyVitezne]        = useState<1 | 2 | 3>(2);
  const [setyDelkaSetu,      setSetyDelkaSetu]      = useState<number>(6);
  const [setyTiebreak,       setSetyTiebreak]       = useState<boolean>(true);
  const [setySuperTiebreak,  setSetySuperTiebreak]  = useState<boolean>(false);
  const [vlastniDelky,       setVlastniDelky]       = useState(false);
  const [delkaSkupinaMin,    setDelkaSkupinaMin]    = useState<number | "">(20);
  const [delkaSemiMin,       setDelkaSemiMin]       = useState<number | "">(20);
  const [delkaFinaleMin,     setDelkaFinaleMin]     = useState<number | "">(25);
  const [pauzaMin,           setPauzaMin]           = useState<number | "">(1);
  // Backwards compat — pro vytvoreniHru
  const playoff = playoffMode !== "bez";
  const multiTier = playoffMode === "umisteni";
  const typPlayoff: "krizovy" | "primy" = "krizovy";
  const [pary,               setPary]               = useState<ParEntry[]>(Array.from({ length: 8 }, (_, i) => ({ id: i, nazevTymu: "", jmeno1: "", pohlavi1: "", jmeno2: "", pohlavi2: "" })));
  const [singlesHraci,       setSinglesHraci]       = useState<SingEntry[]>(Array.from({ length: 8 }, (_, i) => ({ id: i, jmeno: "", pohlavi: "" })));
  const [losovanoSingles,    setLosovanoSingles]    = useState<ParEntry[]>([]);
  const [losovano,           setLosovano]           = useState(false);
  const [losovaneTymy,       setLosovaneTymy]       = useState<ParEntry[] | null>(null);
  const [wizardOpen,         setWizardOpen]         = useState(false);
  const [prevModalOpen,      setPrevModalOpen]      = useState(false);
  type PrevHra = {
    id: string;
    nazev: string;
    created_at: string;
    pocet_kurtu: number;
    settings: Record<string, unknown> | null;
  };
  const [prevHry,            setPrevHry]            = useState<PrevHra[]>([]);
  const [prevNacitam,        setPrevNacitam]        = useState(false);
  const [wizardTymu,         setWizardTymu]         = useState<number | "">(8);
  const [wizardMaxKurtu,     setWizardMaxKurtu]     = useState<number | "">(4);
  const [wizardDelkaH,       setWizardDelkaH]       = useState<number | "">(3);
  const [wizardDelkaM,       setWizardDelkaM]       = useState<number | "">(0);
  const [wizardScoring,      setWizardScoring]      = useState<"gamy" | "cas" | "vse">("vse");
  const [wizardGamyLimit,    setWizardGamyLimit]    = useState<"vse" | 4 | 5 | 6>("vse");
  const [wizardPlayoff,      setWizardPlayoff]      = useState<"vse" | "ano" | "ne" | "umisteni">("vse");
  const [wizardStruktura,    setWizardStruktura]    = useState<"vse" | "skupiny" | "bezSkupin">("vse");
  const [wizardZobrazVse,    setWizardZobrazVse]    = useState(false);

  // localStorage: pamatovat posledni wizard nastaveni
  const WIZARD_LS_KEY = "grand-padel-wizard-v1";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WIZARD_LS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.tymu === "number") setWizardTymu(s.tymu);
      if (typeof s.maxKurtu === "number") setWizardMaxKurtu(s.maxKurtu);
      if (typeof s.delkaH === "number") setWizardDelkaH(s.delkaH);
      if (typeof s.delkaM === "number") setWizardDelkaM(s.delkaM);
      if (typeof s.scoring === "string") setWizardScoring(s.scoring);
      if (typeof s.playoff === "string") setWizardPlayoff(s.playoff);
      if (typeof s.struktura === "string") setWizardStruktura(s.struktura);
      if (s.gamyLimit === "vse" || s.gamyLimit === 4 || s.gamyLimit === 5 || s.gamyLimit === 6) setWizardGamyLimit(s.gamyLimit);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(WIZARD_LS_KEY, JSON.stringify({
        tymu: wizardTymu, maxKurtu: wizardMaxKurtu,
        delkaH: wizardDelkaH, delkaM: wizardDelkaM,
        scoring: wizardScoring, playoff: wizardPlayoff, struktura: wizardStruktura,
        gamyLimit: wizardGamyLimit,
      }));
    } catch { /* ignore */ }
  }, [wizardTymu, wizardMaxKurtu, wizardDelkaH, wizardDelkaM, wizardScoring, wizardPlayoff, wizardStruktura, wizardGamyLimit]);

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
      ? [...prev, ...Array.from({ length: v - prev.length }, (_, i) => ({ id: prev.length + i, nazevTymu: "", jmeno1: "", pohlavi1: "", jmeno2: "", pohlavi2: "" }))]
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
  function nastavNasazeni(id: number, nasazeni: number | null) {
    setPary(prev => prev.map(p => p.id === id ? { ...p, nasazeni } : p));
  }
  function pridejPar() { if (pary.length >= 128) return; const newId = Math.max(0, ...pary.map(p => p.id)) + 1; setPary([...pary, { id: newId, nazevTymu: "", jmeno1: "", pohlavi1: "", jmeno2: "", pohlavi2: "" }]); setPocetTymu(pary.length + 1); }
  function odeberPar(id: number) { if (pary.length <= 2) return; setPary(prev => prev.filter(p => p.id !== id)); setPocetTymu(prev => typeof prev === "number" ? prev - 1 : prev); }
  function updateSingle(id: number, pole: keyof SingEntry, hodnota: string) { setSinglesHraci(prev => prev.map(s => s.id === id ? { ...s, [pole]: hodnota } : s)); }
  function pridejSingle() { const newId = Math.max(0, ...singlesHraci.map(s => s.id)) + 1; setSinglesHraci([...singlesHraci, { id: newId, jmeno: "", pohlavi: "" }]); setPocetSinglesHracu(singlesHraci.length + 1); setLosovano(false); }
  function odeberSingle(id: number) { if (singlesHraci.length <= 2) return; setSinglesHraci(prev => prev.filter(s => s.id !== id)); setPocetSinglesHracu(prev => typeof prev === "number" ? prev - 1 : prev); setLosovano(false); }
  function losuj() { setLosovanoSingles(sparujSingles(singlesHraci)); setLosovano(true); }

  const efektivniTymy = useMemo((): ParEntry[] => {
    if (typ !== "turnaj") return [];
    const platniPary = pary.filter(p => pouzitNazvyTymu ? p.nazevTymu.trim() : (p.jmeno1.trim() && p.jmeno2.trim()));
    if (typParovani === "pary")    return platniPary;
    if (typParovani === "singles") return losovano ? losovanoSingles : sparujSingles(singlesHraci);
    const singPary = losovano ? losovanoSingles : sparujSingles(singlesHraci);
    return [...platniPary, ...singPary];
  }, [typ, typParovani, pouzitNazvyTymu, pary, singlesHraci, losovano, losovanoSingles]);

  const pocetSkupin = useMemo(() => vypocitejPocetSkupin(efektivniTymy.length), [efektivniTymy.length]);
  // Pokud aspoň 1 tym má nasazeni > 0, použij pot system (seeding).
  // Jinak default: snake-style distribuce po (případném) losování.
  const skupiny = useMemo(() => {
    const tymyList = losovaneTymy ?? efektivniTymy;
    const maSeeding = tymyList.some(t => typeof t.nasazeni === "number" && t.nasazeni > 0);
    return maSeeding
      ? rozdelSeSeedingem(tymyList, pocetSkupin)
      : rozdelDoSkupin(tymyList, pocetSkupin);
  }, [losovaneTymy, efektivniTymy, pocetSkupin]);

  // Celkovy cas k dispozici v minutach
  const celkemMinut = useMemo(() => {
    const [hOd, mOd] = casOd.split(":").map(Number);
    const [hDo, mDo] = casDo.split(":").map(Number);
    return (hDo * 60 + mDo) - (hOd * 60 + mOd);
  }, [casOd, casDo]);

  // Predikovany pocet tymu — z formularovych poli (i kdyz uzivatel jeste nezadal jmena)
  const pocetTymuPredikovany = useMemo(() => {
    if (typ !== "turnaj") return 0;
    const p = typeof pocetTymu === "number" ? pocetTymu : 0;
    const s = typeof pocetSinglesHracu === "number" ? Math.floor(pocetSinglesHracu / 2) : 0;
    if (typParovani === "pary") return p;
    if (typParovani === "singles") return s;
    return p + s;
  }, [typ, typParovani, pocetTymu, pocetSinglesHracu]);

  // Pocet zapasu — skupiny + playoff (rozdeleno pro rozpis)
  const pocetZapasuDetail = useMemo(() => {
    const n = pocetTymuPredikovany;
    if (n < 2) return { skupiny: 0, playoff: 0, celkem: 0 };
    const pocetSkupinPred = vypocitejPocetSkupin(n);
    // Skupinove zapasy: vsechny kombinace v ramci skupiny
    const baseSize = Math.floor(n / pocetSkupinPred);
    const extra = n % pocetSkupinPred;
    let skupinaZapasy = 0;
    for (let i = 0; i < pocetSkupinPred; i++) {
      const size = baseSize + (i < extra ? 1 : 0);
      skupinaZapasy += (size * (size - 1)) / 2;
    }
    // Playoff zapasy podle modu
    let playoffZapasy = 0;
    if (playoffMode === "umisteni") {
      // Multi-tier: kazde pasmo 4 tymy = 4 zapasy, mensi pasma = mene
      const pocetPasem = Math.ceil(n / 4);
      for (let p = 0; p < pocetPasem; p++) {
        const tymyPasma = Math.min(4, n - p * 4);
        if (tymyPasma === 4) playoffZapasy += 4;
        else if (tymyPasma === 3) playoffZapasy += 1;
        else if (tymyPasma === 2) playoffZapasy += 1;
      }
    } else if (playoffMode === "vitez") {
      // Single elimination: bracketSize podle volby (auto = nejvetsi 2^k <= n, max 16)
      let bracketSize: number;
      if (vitezBracket === "top4") bracketSize = 4;
      else if (vitezBracket === "top8") bracketSize = 8;
      else if (vitezBracket === "top16") bracketSize = 16;
      else { // auto
        bracketSize = 2;
        while (bracketSize * 2 <= n && bracketSize < 16) bracketSize *= 2;
      }
      // Pokud n < bracketSize, sniz na nejvetsi mocninu 2 ≤ n
      while (bracketSize > n && bracketSize > 2) bracketSize /= 2;
      playoffZapasy = bracketSize - 1;  // single elim, no 3rd place
    } else if (playoffMode === "medaile") {
      // Final Four: 2 semi + finale + o 3. misto = 4 zapasy
      playoffZapasy = n >= 4 ? 4 : (n >= 2 ? 1 : 0);
    }
    // "bez" → 0
    return { skupiny: skupinaZapasy, playoff: playoffZapasy, celkem: skupinaZapasy + playoffZapasy };
  }, [pocetTymuPredikovany, playoffMode, vitezBracket]);

  const pocetZapasu = pocetZapasuDetail.celkem;

  // Auto-vypocet kola pro CAS format
  const autoKolo = useMemo(() => {
    if (scoringTyp !== "cas" || pocetZapasu === 0 || celkemMinut <= 0) return null;
    const kurty = typeof pocetKurtu === "number" ? pocetKurtu : 2;
    const poctyKol = Math.ceil(pocetZapasu / kurty);
    const rezervaNaPrechod = 3;
    const delkaKola = Math.floor((celkemMinut - (poctyKol - 1) * rezervaNaPrechod) / poctyKol);
    return { poctyKol, delkaKola, validni: delkaKola >= 10 };
  }, [scoringTyp, pocetZapasu, pocetKurtu, celkemMinut]);

  // Sync scoringLimit pro cas format
  useEffect(() => {
    if (scoringTyp === "cas" && autoKolo && autoKolo.validni) {
      const cap = Math.min(autoKolo.delkaKola, 60);
      if (scoringLimit !== cap) setScoringLimit(cap);
    }
  }, [scoringTyp, autoKolo, scoringLimit]);

  // Auto-default tiebreak podle limitu gamu: do 4/5 -> sudden_death, do 6+ -> advantage
  useEffect(() => {
    if (scoringTyp !== "gamy") return;
    const novy = scoringLimit >= 6 ? "advantage" : "sudden_death";
    if (gamyTiebreak !== novy) setGamyTiebreak(novy);
  }, [scoringTyp, scoringLimit, gamyTiebreak]);

  const odhadTurnaje = useMemo(() => {
    if (pocetTymuPredikovany < 2) return null;
    const kurty = typeof pocetKurtu === "number" ? pocetKurtu : 2;
    const minNaZapas = scoringTyp === "gamy"
      ? scoringLimit * 3 + 5
      : scoringTyp === "cas"
      ? scoringLimit + 3
      : odhadMinut(scoringLimit) + 5;
    const prechod = 3;

    function casZaZapasy(n: number) {
      if (n === 0) return 0;
      const kol = Math.ceil(n / kurty);
      return kol * minNaZapas + (kol - 1) * prechod;
    }

    const minSkupiny = casZaZapasy(pocetZapasuDetail.skupiny);
    const minPlayoff = casZaZapasy(pocetZapasuDetail.playoff);
    const minPrechodMeziFazemi = (pocetZapasuDetail.skupiny > 0 && pocetZapasuDetail.playoff > 0) ? prechod : 0;
    const totalMin = minSkupiny + minPlayoff + minPrechodMeziFazemi;

    function format(min: number) {
      const h = Math.floor(min / 60), m = min % 60;
      return h > 0 ? `${h}h ${m > 0 ? m + "min" : ""}` : `${m} min`;
    }

    return {
      total: pocetZapasu,
      totalMin,
      text: format(totalMin),
      minSkupiny,
      minSkupinyText: format(minSkupiny),
      minPlayoff,
      minPlayoffText: format(minPlayoff),
      minNaZapas,
      kolSkupin: Math.ceil(pocetZapasuDetail.skupiny / kurty),
      kolPlayoff: Math.ceil(pocetZapasuDetail.playoff / kurty),
      kurty,
    };
  }, [pocetTymuPredikovany, pocetKurtu, scoringTyp, scoringLimit, pocetZapasu, pocetZapasuDetail]);

  // Wizard: doporuceni
  const wizardDelkaMin = useMemo(() => {
    const h = typeof wizardDelkaH === "number" ? wizardDelkaH : 0;
    const m = typeof wizardDelkaM === "number" ? wizardDelkaM : 0;
    return h * 60 + m;
  }, [wizardDelkaH, wizardDelkaM]);

  const wizardVarianty = useMemo(() => {
    const tymu = typeof wizardTymu === "number" ? wizardTymu : 0;
    if (tymu < 2) return [];
    if (wizardDelkaMin <= 0) return [];
    const maxK = typeof wizardMaxKurtu === "number" ? wizardMaxKurtu : 10;
    return generateWizardVariants(
      { pocetTymu: tymu, casOdMin: 0, casDoMin: wizardDelkaMin },
      wizardScoring, maxK, wizardPlayoff, wizardStruktura, wizardGamyLimit,
    );
  }, [wizardTymu, wizardDelkaMin, wizardMaxKurtu, wizardScoring, wizardPlayoff, wizardStruktura, wizardGamyLimit]);

  const wizardDoporuceni = useMemo(
    () => pickWizardRecommendations(wizardVarianty, wizardZobrazVse ? 12 : 6),
    [wizardVarianty, wizardZobrazVse],
  );

  async function otevriPrevModal() {
    setPrevModalOpen(true);
    setPrevNacitam(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPrevNacitam(false); return; }
    const { data } = await supabase
      .from("hry")
      .select("id, nazev, created_at, pocet_kurtu, settings")
      .eq("created_by", user.id)
      .eq("typ", "turnaj")
      .order("created_at", { ascending: false })
      .limit(20);
    setPrevHry((data as PrevHra[]) ?? []);
    setPrevNacitam(false);
  }

  function aplikujPredchoziTurnaj(h: PrevHra) {
    setTyp("turnaj");
    setPocetKurtu(h.pocet_kurtu);
    const s = (h.settings ?? {}) as Record<string, unknown>;
    if (typeof s.cas_od === "string") setCasOd(s.cas_od);
    if (typeof s.cas_do === "string") setCasDo(s.cas_do);
    if (typeof s.scoring_typ === "string") setScoringTyp(s.scoring_typ as "gamy" | "body" | "cas" | "sety");
    if (typeof s.scoring_limit === "number") setScoringLimit(s.scoring_limit);
    if (typeof s.scoring_limit_playoff === "number") {
      setScoringLimitPlayoff(s.scoring_limit_playoff);
      setOdlisnyScoring(s.scoring_limit_playoff !== s.scoring_limit);
    }
    if (typeof s.playoff_mode === "string") setPlayoffMode(s.playoff_mode as "bez" | "medaile" | "vitez" | "umisteni" | "skupiny_o_umisteni");
    if (typeof s.vitez_bracket === "string") setVitezBracket(s.vitez_bracket as "auto" | "top4" | "top8" | "top16");
    if (typeof s.gamy_tiebreak === "string") setGamyTiebreak(s.gamy_tiebreak as "sudden_death" | "advantage");
    if (typeof s.typ_parovani === "string") setTypParovani(s.typ_parovani as "pary" | "singles" | "mix");
    if (typeof s.rezim_kurtu === "string") setRezimKurtu(s.rezim_kurtu as "auto" | "1-1" | "2-1");
    if (typeof s.utech_pavouk === "boolean") setUtechovyPavouk(s.utech_pavouk);
    if (typeof s.bez_skupin === "boolean") setBezSkupin(s.bez_skupin);
    if (typeof s.placement_bracket === "boolean") setPlacementBracket(s.placement_bracket);
    if (s.point_rule === "golden" || s.point_rule === "star" || s.point_rule === "advantage") {
      setPointRule(s.point_rule);
    }
    const tf = s.turnaj_format as Record<string, unknown> | undefined;
    if (tf) {
      const ds = tf.delka_skupina_min, dse = tf.delka_semi_min, df = tf.delka_finale_min, pm = tf.pauza_min;
      const maVlastni = (typeof ds === "number") || (typeof dse === "number") || (typeof df === "number");
      setVlastniDelky(maVlastni);
      if (typeof ds === "number") setDelkaSkupinaMin(ds);
      if (typeof dse === "number") setDelkaSemiMin(dse);
      if (typeof df === "number") setDelkaFinaleMin(df);
      if (typeof pm === "number") setPauzaMin(pm);
    }
    setPrevModalOpen(false);
    setKrok(1);
  }

  function aplikujSablonu(id: string) {
    setTyp("turnaj");
    setOdlisnyScoring(false);
    setVlastniDelky(false);
    setPauzaMin(1);
    setRezimKurtu("auto");
    setTypParovani("pary");
    setPouzitNazvyTymu(false);
    setUtechovyPavouk(false);
    if (id === "classic4") {
      nastavPocetTymu(4);
      setPocetKurtu(2);
      setCasOd("16:00"); setCasDo("18:00");
      setScoringTyp("gamy"); setScoringLimit(4);
      setPlayoffMode("medaile"); // Final Four = krizovy 1v4, 2v3
    } else if (id === "big6") {
      nastavPocetTymu(6);
      setPocetKurtu(2);
      setCasOd("16:00"); setCasDo("19:00");
      setScoringTyp("gamy"); setScoringLimit(4);
      setPlayoffMode("medaile");
    } else if (id === "single8") {
      nastavPocetTymu(8);
      setPocetKurtu(2);
      setCasOd("16:00"); setCasDo("19:00");
      setScoringTyp("gamy"); setScoringLimit(4);
      setPlayoffMode("vitez"); setVitezBracket("top8");
    } else if (id === "social") {
      nastavPocetTymu(6);
      setPocetKurtu(2);
      setCasOd("16:00"); setCasDo("18:30");
      setScoringTyp("cas"); setScoringLimit(15);
      setPlayoffMode("bez");
    }
    setKrok(1);
  }

  function pouzitWizardVariantu(v: WizardVariant) {
    setTyp("turnaj");
    setPocetKurtu(v.pocetKurtu);
    const [hOd, mOd] = casOd.split(":").map(Number);
    const totalMin = (hOd * 60 + mOd) + wizardDelkaMin;
    const hDo = Math.floor((totalMin % (24 * 60)) / 60);
    const mDo = totalMin % 60;
    setCasDo(`${String(hDo).padStart(2, "0")}:${String(mDo).padStart(2, "0")}`);
    setScoringTyp(v.scoringTyp);
    if (v.scoringTyp !== "cas") {
      setScoringLimit(v.scoringLimit);
      setScoringLimitPlayoff(v.scoringLimit);
    }
    setPlayoffMode(v.playoffMode);
    if (v.vitezBracket) setVitezBracket(v.vitezBracket);
    setBezSkupin(v.bezSkupin === true);
    nastavPocetTymu(v.pocetTymu);
    setWizardOpen(false);
  }

  // Format turnaje pro engine
  const turnajFormat = useMemo<TurnajFormat>(() => ({
    scoringTyp,
    scoringLimit,
    scoringLimitPlayoff: odlisnyScoring ? scoringLimitPlayoff : scoringLimit,
    playoffMode,
    vitezBracket,
    utechovyPavouk,
    bezSkupin,
    placementBracket,
    pointRule,
    pocetKurtu: typeof pocetKurtu === "number" ? pocetKurtu : 2,
    casOd,
    casDo,
    delkaSkupinaMin: vlastniDelky && typeof delkaSkupinaMin === "number" ? delkaSkupinaMin : null,
    delkaSemiMin: vlastniDelky && typeof delkaSemiMin === "number" ? delkaSemiMin : null,
    delkaFinaleMin: vlastniDelky && typeof delkaFinaleMin === "number" ? delkaFinaleMin : null,
    pauzaMin: typeof pauzaMin === "number" ? pauzaMin : 1,
    postupovyKlic: klicHlavniN > 0 ? {
      hlavniPocetZeSkupiny: klicHlavniN,
      utechovy: klicUtechOd > 0 && klicUtechDo >= klicUtechOd
        ? { od: klicUtechOd, do: klicUtechDo }
        : undefined,
    } : undefined,
    setyKonfigurace: scoringTyp === "sety" ? {
      vitezne: setyVitezne,
      delkaSetu: setyDelkaSetu,
      setTiebreak: setyTiebreak,
      superTiebreak: setySuperTiebreak,
    } : undefined,
  }), [scoringTyp, scoringLimit, scoringLimitPlayoff, odlisnyScoring, playoffMode, vitezBracket, utechovyPavouk, bezSkupin, placementBracket, pointRule, pocetKurtu, casOd, casDo, vlastniDelky, delkaSkupinaMin, delkaSemiMin, delkaFinaleMin, pauzaMin, klicHlavniN, klicUtechOd, klicUtechDo, setyVitezne, setyDelkaSetu, setyTiebreak, setySuperTiebreak]);

  // Preview rozvrhu — z formularovych poli (s placeholder ID)
  const previewRozvrh = useMemo<Rozvrh | null>(() => {
    if (typ !== "turnaj") return null;
    const tymyList = losovaneTymy ?? efektivniTymy;
    if (tymyList.length < 2) return null;
    const maSeeding = tymyList.some(t => typeof t.nasazeni === "number" && t.nasazeni > 0);
    const skupinyData = maSeeding
      ? rozdelSeSeedingem(tymyList, pocetSkupin)
      : rozdelDoSkupin(tymyList, pocetSkupin);
    const tymyVeSkupinach: TymVeSkupine[] = skupinyData.flatMap((skupina, si) =>
      skupina.map((tym, ti) => ({
        tymId: `preview-${si}-${ti}`,
        nazev: pouzitNazvyTymu && tym.nazevTymu.trim()
          ? tym.nazevTymu.trim()
          : tym.jmeno1.trim() || tym.jmeno2.trim()
            ? `${tym.jmeno1} / ${tym.jmeno2}`.trim()
            : `Tym ${si * 10 + ti + 1}`,
        skupina: SKUPINY_NAZVY[si],
        nasazeni: ti + 1,
      })),
    );
    return generujRozvrh(turnajFormat, tymyVeSkupinach);
  }, [typ, losovaneTymy, efektivniTymy, pocetSkupin, pouzitNazvyTymu, turnajFormat]);

  // Varovani: turnaj se nevejde do casu (gamy/body)
  const turnajSeNevejde = useMemo(() => {
    if (scoringTyp === "cas") return false;
    if (!odhadTurnaje || celkemMinut <= 0) return false;
    return odhadTurnaje.totalMin > celkemMinut;
  }, [scoringTyp, odhadTurnaje, celkemMinut]);

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
        playoff_mode: playoffMode,
        vitez_bracket: vitezBracket,
        gamy_tiebreak: gamyTiebreak,
        typ_parovani: typParovani,
        rezim_kurtu: rezimKurtu,
        utech_pavouk: utechovyPavouk,
        losovani_provedeno: losovaneTymy != null,
        losovani_at: losovaneTymy != null ? new Date().toISOString() : null,
        bez_skupin: bezSkupin,
        placement_bracket: placementBracket,
        postupovy_klic: klicHlavniN > 0 ? {
          hlavni_pocet_ze_skupiny: klicHlavniN,
          utechovy_od: klicUtechOd > 0 ? klicUtechOd : null,
          utechovy_do: klicUtechDo > 0 ? klicUtechDo : null,
        } : null,
        point_rule: pointRule,
        sety_konfigurace: scoringTyp === "sety" ? {
          vitezne: setyVitezne,
          delka_setu: setyDelkaSetu,
          set_tiebreak: setyTiebreak,
          super_tiebreak: setySuperTiebreak,
        } : null,
        turnaj_format: {
          delka_skupina_min: turnajFormat.delkaSkupinaMin,
          delka_semi_min: turnajFormat.delkaSemiMin,
          delka_finale_min: turnajFormat.delkaFinaleMin,
          pauza_min: turnajFormat.pauzaMin,
        },
      },
    }).select().single();

    if (hraErr || !hra) { setChyba("Nepodarilo se vytvorit turnaj."); setStav("chyba"); return; }

    // Pomocna mapa par.id -> {h1Id, h2Id} pro propojeni
    const parToUcastnici: Record<number, { h1Id: string | null; h2Id: string | null }> = {};

    // Pokud nepouzivame nazvy tymu, vlozime individualni hrace do hra_ucastnici
    if (!pouzitNazvyTymu) {
      // Vlozime hrace per par, abychom udrzeli vazbu
      for (const t of tymy) {
        const { data: parUcastnici, error: ucErr } = await supabase.from("hra_ucastnici").insert([
          { hra_id: hra.id, jmeno: t.jmeno1.trim(), pohlavi: t.pohlavi1 || "neuvedeno", user_id: null },
          { hra_id: hra.id, jmeno: t.jmeno2.trim(), pohlavi: t.pohlavi2 || "neuvedeno", user_id: null },
        ]).select();
        if (ucErr || !parUcastnici) { setChyba("Nepodarilo se pridat hrace: " + (ucErr?.message ?? "")); setStav("chyba"); return; }
        parToUcastnici[t.id] = { h1Id: parUcastnici[0]?.id ?? null, h2Id: parUcastnici[1]?.id ?? null };
      }
    }

    // Tymy (pary nebo nazvy) — pouzij losovany seznam pokud existuje.
    // Pokud aspoň jeden tym má nasazeni, použij pot system.
    const tymyZdroj = losovaneTymy ?? tymy;
    const maSeedingFinal = tymyZdroj.some(t => typeof t.nasazeni === "number" && t.nasazeni > 0);
    const skupinyData = maSeedingFinal
      ? rozdelSeSeedingem(tymyZdroj, pocetSkupin)
      : rozdelDoSkupin(tymyZdroj, pocetSkupin);
    const tymyInsert = skupinyData.flatMap((skupina, si) =>
      skupina.map((tym, ti) => {
        const link = parToUcastnici[tym.id];
        return {
          hra_id: hra.id,
          nazev: pouzitNazvyTymu && tym.nazevTymu.trim()
            ? tym.nazevTymu.trim()
            : `${tym.jmeno1} / ${tym.jmeno2}`,
          hrac1_id: link?.h1Id ?? null,
          hrac2_id: link?.h2Id ?? null,
          skupina: SKUPINY_NAZVY[si],
          // Pokud uzivatel zadal globalni nasazeni, ulozime ho. Jinak poradi v ramci skupiny (ti+1).
          nasazeni: typeof tym.nasazeni === "number" && tym.nasazeni > 0 ? tym.nasazeni : ti + 1,
        };
      })
    );

    const { data: createdTymy, error: tymyErr } = await supabase.from("turnaj_tymy").insert(tymyInsert).select();
    if (tymyErr || !createdTymy) { setChyba("Nepodarilo se vytvorit tymy: " + (tymyErr?.message ?? "")); setStav("chyba"); return; }

    // Engine: vygeneruj kompletni rozvrh s casy a kurty
    const tymyVeSkupinach: TymVeSkupine[] = createdTymy.map(t => ({
      tymId: t.id,
      nazev: t.nazev,
      skupina: t.skupina ?? "A",
      nasazeni: t.nasazeni ?? 1,
    }));
    const rozvrh = generujRozvrh(turnajFormat, tymyVeSkupinach);
    // Vlozime zapasy s realnymi ID (skupinove + 1. kolo playoff u "bezSkupin").
    // Placeholder zapasy (vitez semi, …) se vlozi az auto-generaci v TurnajView,
    // ne by se zde duplikovaly.
    const zapasySNymID = rozvrh.zapasy.filter(z => z.tym1Id != null && z.tym2Id != null);
    if (zapasySNymID.length > 0) {
      const zapasyInsert = zapasySNymID.map(z => ({
        hra_id: hra.id,
        faze: z.faze === "skupina" ? "skupina" : "playoff",
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
      const { error: zapasyErr } = await supabase.from("turnaj_zapasy").insert(zapasyInsert);
      if (zapasyErr) { setChyba("Nepodarilo se vlozit rozvrh: " + zapasyErr.message); setStav("chyba"); return; }
    }

    router.push(`/hry/${hra.id}`);
  }

  const maxKrok = typ === "turnaj" ? 5 : 3;

  if (authStav !== "auth") {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#F2EDE4" }}>
          <p className="text-sm" style={{ color: "#9ca3af" }}>
            {authStav === "checking" ? "Nacitam..." : "Presmerovavam na prihlaseni..."}
          </p>
        </main>
      </div>
    );
  }

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
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold" style={{ color: "#0A0A0A" }}>Format hry</h2>
                  <button onClick={() => setWizardOpen(true)}
                    className="text-xs underline" style={{ color: "#801A28" }}>
                    Doporuč variantu turnaje
                  </button>
                </div>
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

              {typ === "turnaj" && (
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: "#374151" }}>Rychlý start</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "classic4", label: "Klasicky 4-tymovy" },
                      { id: "big6", label: "Big 6 tymu, 2 skupiny" },
                      { id: "single8", label: "Drabinka 8 tymu" },
                      { id: "social", label: "Socialni round robin" },
                    ].map(s => (
                      <button key={s.id} onClick={() => aplikujSablonu(s.id)}
                        className="text-left rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium hover:border-[#801A28] transition-colors"
                        style={{ color: "#374151" }}>
                        {s.label}
                      </button>
                    ))}
                    <button onClick={otevriPrevModal}
                      className="text-left rounded-xl border-2 border-dashed border-zinc-300 bg-white px-3 py-2.5 text-xs font-medium hover:border-[#801A28] transition-colors"
                      style={{ color: "#801A28" }}>
                      ⟲ Z předchozího turnaje
                    </button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "#9ca3af" }}>
                    Šablona / předchozí turnaj předvyplní formulář. Můžeš dále upravit.
                  </p>
                </div>
              )}

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
                      <div className="flex items-center gap-3">
                        <input type="number" min={8} max={99} value={bodyNaZapas} onChange={e => setBodyNaZapas(Number(e.target.value))}
                          className="w-24 rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                        <p className="text-sm flex-1" style={{ color: "#6b7280" }}>= cca {odhadMinut(bodyNaZapas)} minut na zapas</p>
                      </div>
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
                        <div className="flex items-center gap-3">
                          <input type="number" min={1} max={60} value={minutNaKolo} onChange={e => setMinutNaKolo(Number(e.target.value))}
                            className="w-24 rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                          <span className="text-sm" style={{ color: "#6b7280" }}>min</span>
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
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Cas na presun</label>
                        <div className="flex items-center gap-3">
                          <input type="number" min={0} max={30} value={minutPresunu} onChange={e => setMinutPresunu(Number(e.target.value))}
                            className="w-24 rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                          <span className="text-sm" style={{ color: "#6b7280" }}>min</span>
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
                          {(["gamy", "sety", "body", "cas"] as const).map(t => (
                            <button key={t} onClick={() => { setScoringTyp(t); setScoringLimit(t === "gamy" ? 6 : t === "body" ? 24 : t === "cas" ? 12 : 6); setScoringLimitPlayoff(t === "gamy" ? 6 : t === "body" ? 24 : t === "cas" ? 12 : 6); }}
                              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all ${scoringTyp === t ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                              {t === "gamy" ? "Gamy" : t === "body" ? "Body" : t === "cas" ? "Čas" : "Sety"}
                            </button>
                          ))}
                        </div>

                        {/* Sub-konfigurace pro SETY */}
                        {scoringTyp === "sety" && (
                          <div className="rounded-xl border border-zinc-200 p-3 mt-1 flex flex-col gap-3">
                            <div>
                              <p className="text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Počet vítězných setů</p>
                              <div className="flex gap-2">
                                {([1, 2, 3] as const).map(n => (
                                  <button key={n} onClick={() => setSetyVitezne(n)}
                                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-all ${setyVitezne === n ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                                    {n === 1 ? "1 set" : n === 2 ? "2 vítězné" : "3 vítězné"}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Délka setu (gamy)</p>
                              <div className="flex gap-2">
                                {[4, 5, 6].map(g => (
                                  <button key={g} onClick={() => setSetyDelkaSetu(g)}
                                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-all ${setyDelkaSetu === g ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                                    do {g}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: "#374151" }}>
                              <input type="checkbox" checked={setyTiebreak} onChange={e => setSetyTiebreak(e.target.checked)} className="mt-0.5" />
                              <span>
                                <strong>Set tiebreak</strong> (při 6:6 hrát tiebreak do 7 bodů)
                              </span>
                            </label>
                            {setyVitezne === 2 && (
                              <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: "#374151" }}>
                                <input type="checkbox" checked={setySuperTiebreak} onChange={e => setSetySuperTiebreak(e.target.checked)} className="mt-0.5" />
                                <span>
                                  <strong>Super-tiebreak místo 3. setu</strong> (1:1 → STB do 10 bodů, kratší zápas)
                                </span>
                              </label>
                            )}
                          </div>
                        )}
                        {scoringTyp === "cas" ? (
                          <div className="rounded-xl p-3 mt-1" style={{ backgroundColor: "#F2EDE4" }}>
                            {!autoKolo ? (
                              <p className="text-xs" style={{ color: "#6b7280" }}>Cas kola se spocita automaticky podle poctu kurtu, casu a poctu zapasu.</p>
                            ) : !autoKolo.validni ? (
                              <p className="text-xs" style={{ color: "#801A28" }}>
                                <strong>Turnaj se nevejde do casu.</strong> Potreba kolo {autoKolo.delkaKola} min (minimum 10).
                                Prodluz cas, sniz pocet tymu, nebo pridej kurt.
                              </p>
                            ) : (
                              <div className="text-xs flex flex-col gap-0.5" style={{ color: "#374151" }}>
                                <p><strong>Kolo: {autoKolo.delkaKola} minut</strong> · {autoKolo.poctyKol} kol synchronne na vsech kurtech</p>
                                <p style={{ color: "#9ca3af" }}>Spocteno z {pocetZapasu} zapasu, {typeof pocetKurtu === "number" ? pocetKurtu : 2} kurtu a {celkemMinut} minut casu.</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 mt-1">
                              <input type="number" min={1} max={99} value={scoringLimit} onChange={e => setScoringLimit(Number(e.target.value))}
                                className="w-24 rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                              <span className="text-sm" style={{ color: "#6b7280" }}>
                                {scoringTyp === "gamy" ? "gamy na zapas" : "bodu na zapas"}
                              </span>
                            </div>
                            {/* Tiebreak pravidlo je skryto — defaultuje se podle limitu gamu:
                                limit 4 a 5 -> sudden_death (vitez na limit), limit 6 -> advantage (klasika).
                                Lze prepnout v rozsirenem nastaveni v budoucnu. */}

                            {/* Point Rule: golden / star / advantage (ovlivnuje delku zapasu) */}
                            {scoringTyp === "gamy" && (
                              <div className="flex flex-col gap-1 mt-2">
                                <p className="text-xs" style={{ color: "#6b7280" }}>Pravidlo na 40:40 v gamu:</p>
                                <div className="flex gap-2">
                                  {([
                                    { v: "star",      l: "Star Point",    p: "3 shody (klasická výhoda), poté Golden Point. ~3–5 min navíc / zápas." },
                                    { v: "golden",    l: "Golden Point",  p: "Hned na 40:40 rozhoduje 1 míč. Nejrychlejší." },
                                    { v: "advantage", l: "Klasické výhody", p: "Bez limitu shod. Nejdelší." },
                                  ] as const).map(p => (
                                    <button key={p.v} onClick={() => setPointRule(p.v)}
                                      className={`flex-1 text-left rounded-lg py-2 px-3 border-2 transition-all ${pointRule === p.v ? "border-[#801A28] bg-red-50" : "border-zinc-200"}`}
                                      style={{ color: pointRule === p.v ? "#801A28" : "#374151" }}>
                                      <div className="text-xs font-semibold">{p.l}</div>
                                      <div className="text-xs font-normal mt-0.5" style={{ color: "#9ca3af" }}>{p.p}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <label className="flex items-center gap-2 text-xs cursor-pointer mt-1" style={{ color: "#6b7280" }}>
                              <input type="checkbox" checked={odlisnyScoring} onChange={e => setOdlisnyScoring(e.target.checked)} className="rounded" />
                              Jiny format pro playoff
                            </label>
                            {odlisnyScoring && (
                              <div className="flex items-center gap-3">
                                <span className="text-xs shrink-0" style={{ color: "#6b7280" }}>Playoff:</span>
                                <input type="number" min={1} max={99} value={scoringLimitPlayoff} onChange={e => setScoringLimitPlayoff(Number(e.target.value))}
                                  className="w-24 rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                                <span className="text-sm" style={{ color: "#6b7280" }}>
                                  {scoringTyp === "gamy" ? "gamy" : "bodu"}
                                </span>
                              </div>
                            )}
                            {turnajSeNevejde && odhadTurnaje && (() => {
                              const chybi = odhadTurnaje.totalMin - celkemMinut;
                              const chybiH = Math.floor(chybi / 60), chybiM = chybi % 60;
                              const chybiText = chybiH > 0 ? `${chybiH}h ${chybiM}min` : `${chybiM} min`;
                              return (
                                <div className="rounded-xl p-3 mt-1" style={{ backgroundColor: "#fef2f2", borderLeft: "3px solid #801A28" }}>
                                  <p className="text-xs font-semibold mb-2" style={{ color: "#801A28" }}>Turnaj nelze stihnout v zadanem case</p>
                                  <div className="grid grid-cols-3 gap-2 mb-2 text-xs" style={{ color: "#7f1d1d" }}>
                                    <div><span style={{ color: "#9ca3af" }}>Potreba:</span> <strong>{odhadTurnaje.text}</strong></div>
                                    <div><span style={{ color: "#9ca3af" }}>K dispozici:</span> <strong>{Math.floor(celkemMinut/60)}h {celkemMinut % 60}min</strong></div>
                                    <div><span style={{ color: "#9ca3af" }}>Chybi:</span> <strong>{chybiText}</strong></div>
                                  </div>
                                  <div className="rounded-lg p-2 mb-2 text-xs" style={{ backgroundColor: "white", color: "#374151" }}>
                                    <p className="font-semibold mb-1" style={{ color: "#0A0A0A" }}>Rozpis casu:</p>
                                    <p>• Skupiny: <strong>{pocetZapasuDetail.skupiny} zapasu</strong> v {odhadTurnaje.kolSkupin} kolech &times; {odhadTurnaje.minNaZapas} min = <strong>{odhadTurnaje.minSkupinyText}</strong></p>
                                    {pocetZapasuDetail.playoff > 0 && (
                                      <p>• Playoff: <strong>{pocetZapasuDetail.playoff} zapasu</strong> v {odhadTurnaje.kolPlayoff} kolech &times; {odhadTurnaje.minNaZapas} min = <strong>{odhadTurnaje.minPlayoffText}</strong></p>
                                    )}
                                    <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>Pocita s {odhadTurnaje.kurty} kurty, {odhadTurnaje.minNaZapas} min/zapas, 3 min prechod mezi koly.</p>
                                  </div>
                                  <p className="text-xs font-semibold mb-1" style={{ color: "#7f1d1d" }}>Mas tri moznosti:</p>
                                  <ul className="text-xs mb-2 ml-4 list-disc" style={{ color: "#7f1d1d" }}>
                                    <li>Prodlouz cas o <strong>{chybiText}</strong> (zmen <em>Cas k dispozici</em> vyse)</li>
                                    <li>Pridej kurty (zkus o 1 vic — <em>Pocet kurtu</em> vyse)</li>
                                    <li>Prepni na format <strong>Cas</strong> — kolo se zkrati a vse se vejde:</li>
                                  </ul>
                                  <button onClick={() => { setScoringTyp("cas"); setScoringLimit(12); setScoringLimitPlayoff(12); }}
                                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: "#801A28" }}>
                                    Prepnout na Cas
                                  </button>
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>

                      {/* Skupinova faze */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Skupinová fáze</label>
                        <div className="flex gap-2">
                          <button onClick={() => setBezSkupin(false)}
                            className={`flex-1 rounded-xl py-2.5 px-3 border-2 text-left transition-all ${!bezSkupin ? "border-[#801A28] bg-red-50" : "border-zinc-200"}`}>
                            <p className="text-sm font-semibold" style={{ color: !bezSkupin ? "#801A28" : "#374151" }}>Ano — skupiny + playoff</p>
                            <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>Tým si zahraje s každým ve skupině, pak playoff dle umístění.</p>
                          </button>
                          <button onClick={() => setBezSkupin(true)}
                            className={`flex-1 rounded-xl py-2.5 px-3 border-2 text-left transition-all ${bezSkupin ? "border-[#801A28] bg-red-50" : "border-zinc-200"}`}>
                            <p className="text-sm font-semibold" style={{ color: bezSkupin ? "#801A28" : "#374151" }}>Ne — rovnou playoff</p>
                            <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>Bez skupin. Týmy jdou rovnou do pavouka podle nasazení.</p>
                          </button>
                        </div>
                      </div>

                      {/* Playoff mod */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Playoff</label>
                        <div className="flex flex-col gap-2">
                          {([
                            { v: "umisteni", l: "Dohrávat o umístění (pavouk)", p: "Vyřazovací systém o všechna místa — 1A vs 2B, 1B vs 2A → finále + o 3. místo. Pro 8+ týmů paralelní pásma." },
                            { v: "skupiny_o_umisteni", l: "Skupiny o umístění (bez vyřazování)", p: "Po skupinách druhá fáze ROUND-ROBIN — horní polovina hraje skupinu o 1.-X. místo, dolní o (X+1).-N. místo. Pro 8 týmů = 24 zápasů (žádná dramata vyřazení)." },
                            { v: "vitez",    l: "Hrát o vítěze (single elim)",     p: "Top X týmů vyřazovací pavouk — po první prohře konec. Bez 3. místa." },
                            { v: "medaile",  l: "Jen o medaile (Final Four)",      p: "Top 4 týmy → semifinále + finále + o 3. místo (4 zápasy)." },
                            { v: "bez",      l: "Bez playoff",                     p: "Konečné pořadí podle skupin." },
                          ] as const).map(m => (
                            <button key={m.v} onClick={() => setPlayoffMode(m.v)}
                              className={`text-left rounded-xl py-2.5 px-3 border-2 transition-all ${playoffMode === m.v ? "border-[#801A28] bg-red-50" : "border-zinc-200 hover:border-zinc-300"}`}>
                              <p className="text-sm font-semibold" style={{ color: playoffMode === m.v ? "#801A28" : "#374151" }}>{m.l}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{m.p}</p>
                            </button>
                          ))}
                        </div>
                        {playoffMode === "vitez" && (
                          <div className="mt-2 flex flex-col gap-1.5">
                            <p className="text-xs font-medium" style={{ color: "#374151" }}>Velikost pavouka:</p>
                            <div className="flex gap-2">
                              {([
                                { v: "auto",  l: "Auto",       d: "podle poctu" },
                                { v: "top4",  l: "Top 4 (SF)", d: "3 zapasy" },
                                { v: "top8",  l: "Top 8 (QF)", d: "7 zapasu" },
                                { v: "top16", l: "Top 16 (R16)", d: "15 zapasu" },
                              ] as const).map(b => (
                                <button key={b.v} onClick={() => setVitezBracket(b.v)}
                                  className={`flex-1 rounded-lg py-2 px-2 text-xs font-semibold border-2 transition-all ${vitezBracket === b.v ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                                  <div>{b.l}</div>
                                  <div className="text-xs font-normal opacity-70 mt-0.5">{b.d}</div>
                                </button>
                              ))}
                            </div>
                            <label className="flex items-start gap-2 mt-2 cursor-pointer rounded-lg border border-zinc-200 p-3 hover:border-[#801A28]">
                              <input type="checkbox" checked={placementBracket}
                                onChange={e => setPlacementBracket(e.target.checked)}
                                className="mt-0.5" />
                              <span className="text-sm" style={{ color: "#374151" }}>
                                <strong>Hrát o všechna umístění</strong> (placement bracket)
                                <span className="block text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                                  Každý tým hraje až do konce o své umístění. 8t = 12 zápasů (3 kola), 16t = 32, 32t = 80, 64t = 192. Poražení nekončí — pokračují ve svém pásmu.
                                </span>
                              </span>
                            </label>

                            {/* POSTUPOVÝ KLÍČ — jen pro single elim se skupinami */}
                            {!bezSkupin && (
                              <div className="mt-3 rounded-lg border border-zinc-200 p-3">
                                <p className="text-sm font-semibold mb-2" style={{ color: "#374151" }}>Postupový klíč</p>
                                <p className="text-xs mb-3" style={{ color: "#9ca3af" }}>
                                  Kdo ze skupiny postupuje do kterého pavouka. Nech 0 pro automatický výběr top N podle velikosti pavouka.
                                </p>
                                <div className="flex items-center gap-2 mb-2">
                                  <label className="text-xs flex-1" style={{ color: "#374151" }}>
                                    <strong>Hlavní pavouk:</strong> top
                                  </label>
                                  <input type="number" min={0} max={8}
                                    value={klicHlavniN}
                                    onChange={e => setKlicHlavniN(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-14 rounded border border-zinc-200 px-2 py-1 text-xs text-center" />
                                  <span className="text-xs" style={{ color: "#9ca3af" }}>z každé skupiny</span>
                                </div>
                                {klicHlavniN > 0 && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <label className="text-xs flex-1" style={{ color: "#374151" }}>
                                        <strong>Útěchový pavouk:</strong> pozice
                                      </label>
                                      <input type="number" min={0} max={8}
                                        value={klicUtechOd}
                                        onChange={e => setKlicUtechOd(Math.max(0, parseInt(e.target.value) || 0))}
                                        placeholder="od"
                                        className="w-14 rounded border border-zinc-200 px-2 py-1 text-xs text-center" />
                                      <span className="text-xs" style={{ color: "#9ca3af" }}>–</span>
                                      <input type="number" min={0} max={8}
                                        value={klicUtechDo}
                                        onChange={e => setKlicUtechDo(Math.max(0, parseInt(e.target.value) || 0))}
                                        placeholder="do"
                                        className="w-14 rounded border border-zinc-200 px-2 py-1 text-xs text-center" />
                                    </div>
                                    <p className="text-xs mt-2" style={{ color: "#9ca3af" }}>
                                      Příklad: hlavní top 2, útěch 3-4 = nejlepší 2 ze skupiny do hlavního pavouka, 3.-4. místa do útěchového pavouka (Plate). Hraje se paralelně.
                                    </p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Utechovy pavouk — jen pro medaile/vitez (placement uz pokryva poražené) */}
                        {(playoffMode === "medaile" || playoffMode === "vitez") && (
                          <label className="mt-3 flex items-start gap-2 cursor-pointer rounded-lg border border-zinc-200 p-3 hover:border-[#801A28]">
                            <input type="checkbox" checked={utechovyPavouk}
                              onChange={e => setUtechovyPavouk(e.target.checked)}
                              className="mt-0.5" />
                            <span className="text-sm" style={{ color: "#374151" }}>
                              <strong>Útěchový pavouk</strong> (Turnaj druhé šance)
                              <span className="block text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                                Poražení z prvního kola playoff hrají paralelní bracket — všichni si zahrajou víc zápasů.
                              </span>
                            </span>
                          </label>
                        )}
                      </div>

                      {/* Rezim kurtu */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "#374151" }}>Rezim kurtu</label>
                        <div className="flex flex-col gap-2">
                          {([
                            { v: "auto", l: "Automaticky (doporuceno)", p: "System prirazuje kurt podle dostupnosti — optimalni vyuziti." },
                            { v: "1-1",  l: "1 kurt = 1 skupina",       p: "Kazda skupina hraje na svem kurtu po sobe. Skupina muze cekat na dohrani jine." },
                            { v: "2-1",  l: "2 kurty = 1 skupina",      p: "Dvojice kurtu hraje jednu skupinu paralelne." },
                          ] as const).map(r => (
                            <button key={r.v} onClick={() => setRezimKurtu(r.v)}
                              className={`text-left rounded-xl py-2.5 px-3 border-2 transition-all ${rezimKurtu === r.v ? "border-[#801A28] bg-red-50" : "border-zinc-200 hover:border-zinc-300"}`}>
                              <p className="text-sm font-semibold" style={{ color: rezimKurtu === r.v ? "#801A28" : "#374151" }}>{r.l}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{r.p}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button onClick={() => setKrok(2)} disabled={
                !typ ||
                (typ === "turnaj" && scoringTyp === "cas" && autoKolo !== null && !autoKolo.validni) ||
                (typ === "turnaj" && scoringTyp !== "cas" && turnajSeNevejde)
              }
                className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#801A28" }}>
                {typ === "turnaj" && turnajSeNevejde && scoringTyp !== "cas"
                  ? "Turnaj se nevejde do casu"
                  : "Pokracovat"}
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
                <p className="text-sm" style={{ color: "#6b7280" }}>Max 128 paru · pohlavi M/Z je volitelne (pomaha pri losovani)</p>
              </div>

              {/* Toggle nazev tymu vs jmena hracu */}
              {(typParovani === "pary" || typParovani === "mix") && (
                <div className="bg-white rounded-xl border border-zinc-100 p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "#374151" }}>Jak zadat pary</p>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      {pouzitNazvyTymu ? "Jeden nazev tymu (napr. 'Drtice Praha')" : "Jmena dvou hracu (napr. 'Petr / Jana')"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setPouzitNazvyTymu(false)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${!pouzitNazvyTymu ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-500"}`}>
                      Jmena
                    </button>
                    <button onClick={() => setPouzitNazvyTymu(true)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${pouzitNazvyTymu ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-500"}`}>
                      Nazev tymu
                    </button>
                  </div>
                </div>
              )}

              {/* Pary */}
              {(typParovani === "pary" || typParovani === "mix") && (
                <div className="flex flex-col gap-3">
                  {typParovani === "mix" && <p className="text-xs font-semibold" style={{ color: "#374151" }}>Hotove pary:</p>}
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs" style={{ color: "#6b7280" }}>
                    <strong style={{ color: "#374151" }}>Nasazení (volitelné):</strong> nasazené týmy se rozdělí spravedlivě do skupin (pot system). 1.-K. nasazený → jeden do každé skupiny, K+1..2K do dalšího potu opačně, atd. Nech prázdné pro náhodné rozlosování.
                  </div>
                  {pary.map((p, i) => (
                    <div key={p.id} className="bg-white rounded-xl border border-zinc-100 p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold" style={{ color: "#9ca3af" }}>{pouzitNazvyTymu ? `Tym ${i + 1}` : `Par ${i + 1}`}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs whitespace-nowrap" style={{ color: "#9ca3af" }}>Nasazení:</label>
                          <input type="number" min={0} max={64}
                            value={p.nasazeni ?? ""}
                            onChange={e => {
                              const v = e.target.value;
                              if (v === "") { nastavNasazeni(p.id, null); return; }
                              const n = parseInt(v);
                              nastavNasazeni(p.id, isNaN(n) || n <= 0 ? null : n);
                            }}
                            placeholder="—"
                            className="w-14 rounded border border-zinc-200 px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                          {pary.length > 2 && <button onClick={() => odeberPar(p.id)} className="text-xs" style={{ color: "#9ca3af" }}>odebrat</button>}
                        </div>
                      </div>
                      {pouzitNazvyTymu ? (
                        <input type="text" placeholder="Nazev tymu" value={p.nazevTymu} onChange={e => updatePar(p.id, "nazevTymu", e.target.value)}
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                      ) : (
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
                      )}
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

              {/* Rozlosovat — kliknut jen jednou. Znovu jen po potvrzeni. */}
              <div className="flex items-center justify-between gap-3 px-1">
                <p className="text-xs" style={{ color: losovaneTymy ? "#16a34a" : "#9ca3af" }}>
                  {losovaneTymy ? "Losování provedeno (fair-play: jen 1× klik)" : "Páry jsou v zadaném pořadí — klikni pro náhodné rozlosování."}
                </p>
                {!losovaneTymy ? (
                  <button onClick={() => setLosovaneTymy(shuffleArray(efektivniTymy))}
                    className="shrink-0 rounded-lg px-4 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: "#801A28" }}>
                    Rozlosovat
                  </button>
                ) : (
                  <button onClick={() => {
                    const odpoved = window.prompt(
                      "Losování již proběhlo. Opakované losování zhoršuje fair-play.\n\n" +
                      'Pro nové losování napiš slovo "LOSUJ":',
                    );
                    if (odpoved?.trim().toUpperCase() === "LOSUJ") {
                      setLosovaneTymy(shuffleArray(efektivniTymy));
                    }
                  }}
                    className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium border border-zinc-200"
                    style={{ color: "#9ca3af" }}>
                    Losovat znovu (vyžaduje potvrzení)
                  </button>
                )}
              </div>

              {skupiny.map((skupina, si) => (
                <div key={si} className="bg-white rounded-2xl border border-zinc-100 p-5">
                  <p className="text-xs font-bold mb-3" style={{ color: "#801A28" }}>Skupina {SKUPINY_NAZVY[si]}</p>
                  <div className="flex flex-col gap-1.5">
                    {skupina.map((tym, ti) => (
                      <div key={tym.id} className="flex items-center gap-2 text-sm">
                        <span className="w-4 shrink-0" style={{ color: "#9ca3af" }}>{ti + 1}.</span>
                        {tym.nazevTymu.trim() ? (
                          <span className="font-medium" style={{ color: "#0A0A0A" }}>{tym.nazevTymu}</span>
                        ) : (
                          <>
                            <span className="font-medium" style={{ color: "#0A0A0A" }}>{tym.jmeno1}</span>
                            <span style={{ color: "#9ca3af" }}>/</span>
                            <span className="font-medium" style={{ color: "#0A0A0A" }}>{tym.jmeno2}</span>
                            {(tym.pohlavi1 || tym.pohlavi2) && (
                              <span className="text-xs" style={{ color: "#d1d5db" }}>({tym.pohlavi1 || "?"}/{tym.pohlavi2 || "?"})</span>
                            )}
                          </>
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
                  Format: {scoringTyp === "gamy"
                    ? `do ${scoringLimit} gamu`
                    : scoringTyp === "body"
                    ? `${scoringLimit} bodu na zapas`
                    : `${scoringLimit} minut na zapas`}
                  {odlisnyScoring
                    ? ` · playoff: ${scoringTyp === "gamy"
                        ? `do ${scoringLimitPlayoff}`
                        : scoringTyp === "body"
                        ? `${scoringLimitPlayoff} bodu`
                        : `${scoringLimitPlayoff} minut`}`
                    : ""}
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

              {/* Doplnkova nastaveni — bez utechu, ten je v kroku 3 */}
              <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex flex-col gap-4">
                <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>Doplnkova nastaveni</p>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={vlastniDelky} onChange={e => setVlastniDelky(e.target.checked)} className="mt-0.5" />
                  <span className="text-sm" style={{ color: "#374151" }}>
                    Vlastni delky zapasu (jinak odvozeno z formatu)
                  </span>
                </label>

                {vlastniDelky && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-6">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "#6b7280" }}>Skupina (min)</label>
                      <input type="number" min={5} max={120} value={delkaSkupinaMin}
                        onChange={e => setDelkaSkupinaMin(e.target.value === "" ? "" : parseInt(e.target.value))}
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "#6b7280" }}>Semi (min)</label>
                      <input type="number" min={5} max={120} value={delkaSemiMin}
                        onChange={e => setDelkaSemiMin(e.target.value === "" ? "" : parseInt(e.target.value))}
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "#6b7280" }}>Finale (min)</label>
                      <input type="number" min={5} max={120} value={delkaFinaleMin}
                        onChange={e => setDelkaFinaleMin(e.target.value === "" ? "" : parseInt(e.target.value))}
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "#6b7280" }}>Pauza (min)</label>
                      <input type="number" min={0} max={30} value={pauzaMin}
                        onChange={e => setPauzaMin(e.target.value === "" ? "" : parseInt(e.target.value))}
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {chyba && <p className="text-sm text-center" style={{ color: "#801A28" }}>{chyba}</p>}

              <div className="flex gap-3">
                <button onClick={() => { setKrok(3); setLosovaneTymy(null); }} className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-300 bg-white" style={{ color: "#374151" }}>Zpet</button>
                <button onClick={() => setKrok(5)}
                  className="flex-1 rounded-full py-3 text-sm font-semibold text-white"
                  style={{ backgroundColor: "#801A28" }}>
                  Pokracovat na preview
                </button>
              </div>
            </div>
          )}

          {/* ===== KROK 5 — Preview rozvrhu (turnaj) ===== */}
          {krok === 5 && typ === "turnaj" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-semibold mb-1" style={{ color: "#0A0A0A" }}>Preview rozvrhu</h2>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  {previewRozvrh
                    ? `${previewRozvrh.zapasy.length} zapasu · zacatek ${casOd} · odhadovany konec ${previewRozvrh.zapasy.length > 0 ? previewRozvrh.zapasy[previewRozvrh.zapasy.length - 1].casKonec : casOd}`
                    : "Zatim neni dost dat pro preview."}
                </p>
              </div>

              {previewRozvrh && previewRozvrh.varovani.length > 0 && (
                <div className="rounded-2xl border px-5 py-4"
                  style={{ backgroundColor: previewRozvrh.vejdeSe ? "#fefce8" : "#fef2f2",
                           borderColor: previewRozvrh.vejdeSe ? "#fde047" : "#fecaca" }}>
                  {previewRozvrh.varovani.map((v, i) => (
                    <p key={i} className="text-sm" style={{ color: previewRozvrh.vejdeSe ? "#854d0e" : "#7f1d1d" }}>{v}</p>
                  ))}
                  {!previewRozvrh.vejdeSe && (
                    <p className="text-xs mt-2" style={{ color: "#7f1d1d" }}>
                      Doporuceni: zkrat delku zapasu, pridej kurt, zmen format na &quot;Cas&quot; nebo posun konec turnaje.
                    </p>
                  )}
                </div>
              )}

              {previewRozvrh && previewRozvrh.zapasy.length > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 text-xs" style={{ color: "#6b7280" }}>
                      <tr>
                        <th className="text-left px-3 py-2">Cas</th>
                        <th className="text-left px-3 py-2">Kurt</th>
                        <th className="text-left px-3 py-2">Faze</th>
                        <th className="text-left px-3 py-2">Zapas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRozvrh.zapasy.map(z => (
                        <tr key={z.poradiFronta} className="border-t border-zinc-100">
                          <td className="px-3 py-2 whitespace-nowrap" style={{ color: "#374151" }}>{z.casZacatek}-{z.casKonec}</td>
                          <td className="px-3 py-2" style={{ color: "#374151" }}>K{z.kurt}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: "#9ca3af" }}>{z.umisteni ?? z.faze}</td>
                          <td className="px-3 py-2" style={{ color: "#0A0A0A" }}>
                            {z.tym1Label} <span style={{ color: "#9ca3af" }}>vs</span> {z.tym2Label}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {chyba && <p className="text-sm text-center" style={{ color: "#801A28" }}>{chyba}</p>}

              <div className="flex gap-3">
                <button onClick={() => setKrok(4)} className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-300 bg-white" style={{ color: "#374151" }}>Zpet</button>
                <button onClick={vytvorHru} disabled={stav === "loading" || !previewRozvrh}
                  className="flex-1 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: "#801A28" }}>
                  {stav === "loading" ? "Vytvarim..." : "Spustit turnaj"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modal: Predchozi turnaje */}
      {prevModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setPrevModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full my-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1" style={{ color: "#0A0A0A" }}>Použít nastavení z předchozího turnaje</h3>
            <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
              Vyber turnaj, jehož formát chceš zopakovat. Týmy a hráče zadáš ručně, nastavení (kurty, scoring, playoff) se zkopíruje.
            </p>
            {prevNacitam ? (
              <p className="text-sm py-8 text-center" style={{ color: "#9ca3af" }}>Načítám…</p>
            ) : prevHry.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "#9ca3af" }}>Žádné předchozí turnaje.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                {prevHry.map(h => {
                  const s = (h.settings ?? {}) as Record<string, unknown>;
                  return (
                    <button key={h.id} onClick={() => aplikujPredchoziTurnaj(h)}
                      className="text-left rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:border-[#801A28] transition-colors">
                      <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>{h.nazev}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                        {new Date(h.created_at).toLocaleDateString("cs-CZ")}
                        {" · "}{h.pocet_kurtu} {h.pocet_kurtu === 1 ? "kurt" : h.pocet_kurtu < 5 ? "kurty" : "kurtů"}
                        {s.scoring_typ ? ` · ${s.scoring_typ}` : ""}
                        {typeof s.scoring_limit === "number" ? ` ${s.scoring_limit}` : ""}
                        {s.bez_skupin === true ? " · bez skupin" : ""}
                        {s.playoff_mode && s.playoff_mode !== "bez" ? ` · ${s.playoff_mode}` : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={() => setPrevModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-zinc-200"
                style={{ color: "#374151" }}>
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard modal */}
      {wizardOpen && (() => {
        const popisPlayoff = (m: WizardPlayoffMode, vb?: WizardVitezBracket) => {
          if (m === "bez") return "bez playoff";
          if (m === "medaile") return "Final Four (4 zápasy)";
          if (m === "vitez") return `single elim${vb && vb !== "auto" ? ` (${vb})` : ""}`;
          if (m === "skupiny_o_umisteni") return "Skupiny o umístění";
          return "Pavouk o umístění (multi-tier)";
        };
        const popisFormat = (v: WizardVariant) => {
          if (v.scoringTyp === "cas") {
            // Odhad kolik gamu se stihne za scoringDelkaKola minut — predpoklad ~3 min/game
            const odhadGamu = v.scoringDelkaKola ? Math.max(2, Math.floor(v.scoringDelkaKola / 3)) : 0;
            return `${v.scoringDelkaKola} min/zápas (≈ ${odhadGamu} gamů)`;
          }
          if (v.scoringTyp === "gamy") return `do ${v.scoringLimit} gamů`;
          return `${v.scoringLimit} bodů`;
        };
        const formatMin = (m: number) => {
          const h = Math.floor(m / 60), mm = m % 60;
          return h > 0 ? `${h}h ${mm > 0 ? mm + "min" : ""}` : `${mm} min`;
        };
        const tagInfo = (tag: string) => {
          if (tag === "optimalni") return { label: "OPTIMÁLNÍ", color: "#801A28" };
          if (tag === "nejvice") return { label: "MAX ZÁPASŮ", color: "#0f766e" };
          return { label: "S REZERVOU", color: "#16a34a" };
        };
        const renderVariant = (v: WizardVariant, idx: number) => {
          const tag = (v as WizardVariant & { _tag?: string })._tag ?? "optimalni";
          const { label, color } = tagInfo(tag);
          return (
            <div key={idx} className="rounded-xl p-4 border-2" style={{ borderColor: color, backgroundColor: "#fafafa" }}>
              <p className="text-xs font-bold mb-2" style={{ color }}>{label}</p>
              <p className="text-sm font-semibold mb-1" style={{ color: "#0A0A0A" }}>
                {v.pocetKurtu} {v.pocetKurtu === 1 ? "kurt" : v.pocetKurtu < 5 ? "kurty" : "kurtů"}, {popisFormat(v)}, {popisPlayoff(v.playoffMode, v.vitezBracket)}
                {v.bezSkupin && <span className="ml-1" style={{ color: "#0f766e" }}>· bez skupin</span>}
              </p>
              <div className="text-xs space-y-0.5" style={{ color: "#6b7280" }}>
                <p>{v.zapasuSkupiny + v.zapasuPlayoff} zápasů {v.bezSkupin ? `(jen playoff)` : `(${v.zapasuSkupiny} skupin + ${v.zapasuPlayoff} playoff)`}</p>
                <p>Potřeba {formatMin(v.totalMin)}, rezerva <strong>{formatMin(v.rezerva)}</strong></p>
              </div>
              <button onClick={() => pouzitWizardVariantu(v)}
                className="mt-3 w-full rounded-lg py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: color }}>
                Použít tuto variantu
              </button>
            </div>
          );
        };
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setWizardOpen(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#0A0A0A" }}>Doporuč variantu turnaje</h3>
              <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                Zadej kolik máš týmů a kolik času — najdu pro tebe nejlepší kombinace.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Počet týmů</label>
                  <input type="number" min={2} max={128} value={wizardTymu}
                    onChange={e => { const n = parseInt(e.target.value); setWizardTymu(isNaN(n) ? "" : n); }}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Max kurtů</label>
                  <input type="number" min={1} max={20} value={wizardMaxKurtu}
                    onChange={e => { const n = parseInt(e.target.value); setWizardMaxKurtu(isNaN(n) ? "" : n); }}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Hodiny</label>
                  <input type="number" min={0} max={12} value={wizardDelkaH}
                    onChange={e => { const n = parseInt(e.target.value); setWizardDelkaH(isNaN(n) ? "" : n); }}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Minuty</label>
                  <input type="number" min={0} max={59} step={5} value={wizardDelkaM}
                    onChange={e => { const n = parseInt(e.target.value); setWizardDelkaM(isNaN(n) ? "" : n); }}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                </div>
              </div>

              <div className="mb-3 flex gap-1.5 flex-wrap">
                {[
                  { h: 1, m: 30, label: "1.5h" },
                  { h: 2, m: 0, label: "2h" },
                  { h: 3, m: 0, label: "3h" },
                  { h: 4, m: 0, label: "4h" },
                  { h: 5, m: 0, label: "5h" },
                  { h: 6, m: 0, label: "6h" },
                ].map(p => (
                  <button key={p.label}
                    onClick={() => { setWizardDelkaH(p.h); setWizardDelkaM(p.m); }}
                    className="rounded-full px-3 py-1 text-xs font-medium border border-zinc-200 hover:border-[#801A28] hover:text-[#801A28]"
                    style={{ color: "#6b7280", backgroundColor: "white" }}>
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="mb-3">
                <label className="text-xs font-medium block mb-1.5" style={{ color: "#374151" }}>Způsob počítání</label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    ["vse", "Je mi to jedno"],
                    ["gamy", "Na gamy"],
                    ["cas", "Na čas"],
                  ] as Array<["vse" | "gamy" | "cas", string]>).map(([k, label]) => (
                    <button key={k} onClick={() => setWizardScoring(k)}
                      className="rounded-full px-3 py-1 text-xs font-medium border transition-colors"
                      style={wizardScoring === k
                        ? { backgroundColor: "#801A28", color: "white", borderColor: "#801A28" }
                        : { color: "#374151", borderColor: "#e5e7eb", backgroundColor: "white" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {(wizardScoring === "gamy" || wizardScoring === "vse") && (
                <div className="mb-3">
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "#374151" }}>Do kolika gamů</label>
                  <div className="flex gap-2 flex-wrap">
                    {([
                      ["vse", "Je mi to jedno"],
                      [4, "Do 4"],
                      [5, "Do 5"],
                      [6, "Do 6"],
                    ] as Array<["vse" | 4 | 5 | 6, string]>).map(([k, label]) => (
                      <button key={String(k)} onClick={() => setWizardGamyLimit(k)}
                        className="rounded-full px-3 py-1 text-xs font-medium border transition-colors"
                        style={wizardGamyLimit === k
                          ? { backgroundColor: "#801A28", color: "white", borderColor: "#801A28" }
                          : { color: "#374151", borderColor: "#e5e7eb", backgroundColor: "white" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="text-xs font-medium block mb-1.5" style={{ color: "#374151" }}>Playoff</label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    ["vse", "Je mi to jedno"],
                    ["ano", "S playoff"],
                    ["umisteni", "O všechna umístění"],
                    ["ne", "Bez playoff"],
                  ] as Array<["vse" | "ano" | "umisteni" | "ne", string]>).map(([k, label]) => (
                    <button key={k} onClick={() => setWizardPlayoff(k)}
                      className="rounded-full px-3 py-1 text-xs font-medium border transition-colors"
                      style={wizardPlayoff === k
                        ? { backgroundColor: "#801A28", color: "white", borderColor: "#801A28" }
                        : { color: "#374151", borderColor: "#e5e7eb", backgroundColor: "white" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium block mb-1.5" style={{ color: "#374151" }}>Struktura</label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    ["vse", "Je mi to jedno"],
                    ["skupiny", "Skupiny + playoff"],
                    ["bezSkupin", "Jen playoff (bez skupin)"],
                  ] as Array<["vse" | "skupiny" | "bezSkupin", string]>).map(([k, label]) => (
                    <button key={k} onClick={() => setWizardStruktura(k)}
                      className="rounded-full px-3 py-1 text-xs font-medium border transition-colors"
                      style={wizardStruktura === k
                        ? { backgroundColor: "#801A28", color: "white", borderColor: "#801A28" }
                        : { color: "#374151", borderColor: "#e5e7eb", backgroundColor: "white" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {wizardDoporuceni.length === 0 ? (
                <div className="rounded-xl p-4" style={{ backgroundColor: "#fef2f2" }}>
                  <p className="text-sm font-semibold" style={{ color: "#801A28" }}>Žádná varianta se nevejde do času.</p>
                  <p className="text-xs mt-1" style={{ color: "#7f1d1d" }}>
                    Zkus prodloužit čas, snížit počet týmů nebo přepnout způsob počítání.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {wizardDoporuceni.map((v, i) => renderVariant(v, i))}
                  </div>
                  {!wizardZobrazVse && wizardVarianty.filter(v => v.fits).length > wizardDoporuceni.length && (
                    <div className="flex justify-center mb-3">
                      <button onClick={() => setWizardZobrazVse(true)}
                        className="text-xs font-medium underline"
                        style={{ color: "#801A28" }}>
                        Zobrazit další varianty
                      </button>
                    </div>
                  )}
                </>
              )}

              <p className="text-xs mb-3" style={{ color: "#9ca3af" }}>
                Wizard zkusil {wizardVarianty.length} kombinací.
                Z toho {wizardVarianty.filter(v => v.fits).length} se vejde do času.
              </p>

              <div className="flex justify-end">
                <button onClick={() => setWizardOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium border border-zinc-200"
                  style={{ color: "#374151" }}>
                  Zavřít
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
