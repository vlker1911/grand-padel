// Engine pro generovani rozvrhu turnaje s casy a kurty.
// Bere konfiguraci (settings) + seznam tymu rozdelenych do skupin a vraci
// kompletni rozvrh: kdy, na kterem kurtu a v jake fazi se hraje.
//
// PRAVIDLA (viz web-app/CLAUDE.md):
//   1. Maximalni vyuziti kurtu — pokud je vic zapasu k naplanovani,
//      bezi paralelne na ruznych kurtech.
//   2. Multi-tier playoff pasma bezi paralelne, ne sekvencne.
//   3. Finale cela (1.-4.) je VZDY posledni zapas turnaje.
//   4. Zadny tym nehraje 2 zapasy zaroven (pauza mezi zapasy >= pauzaMin).

export type PlayoffMode = "bez" | "medaile" | "vitez" | "umisteni" | "skupiny_o_umisteni";
export type ScoringTyp = "gamy" | "body" | "cas";
export type VitezBracket = "auto" | "top4" | "top8" | "top16";
// Pravidlo na 40:40 v game:
//   golden — Golden Point, jeden rozhodujici mic. Default (rychly).
//   star   — Star Point, returner si vybira stranu. ~4 min delsi/zapas.
//   advantage — Klasicka vyhoda (jako v tenisu). Nejdelsi.
export type PointRule = "golden" | "star" | "advantage";

export type TurnajFormat = {
  scoringTyp: ScoringTyp;
  scoringLimit: number;
  scoringLimitPlayoff: number;
  playoffMode: PlayoffMode;
  vitezBracket: VitezBracket;
  utechovyPavouk: boolean;
  bezSkupin: boolean;     // true = preskoc skupinovou fazi, hraj rovnou playoff (nasazeni = poradi)
  pointRule: PointRule;   // pravidlo na 40:40 v game; ovlivnuje prumernou delku zapasu
  pocetKurtu: number;
  casOd: string;          // "HH:MM"
  casDo: string;          // "HH:MM"
  delkaSkupinaMin: number | null;
  delkaSemiMin: number | null;
  delkaFinaleMin: number | null;
  pauzaMin: number;
};

export type TymVeSkupine = {
  tymId: string;
  nazev: string;
  skupina: string;        // "A", "B", ...
  nasazeni: number;
};

export type GenZapas = {
  faze: "skupina" | "skupina_o_umisteni" | "ctvrtfinale" | "semifinale" | "finale" | "o_3_misto" |
        "playoff" | "utech_1" | "utech_2" | "utech_finale";
  skupina: string | null;
  kolo: number | null;
  tym1Id: string | null;
  tym2Id: string | null;
  tym1Label: string;
  tym2Label: string;
  casZacatek: string;
  casKonec: string;
  kurt: number;
  poradiFronta: number;
  umisteni: string | null;
  jeFinaleCela: boolean;      // true pro absolutni finale (posledni zapas turnaje)
};

export type Rozvrh = {
  zapasy: GenZapas[];
  trvaniMin: number;
  casovyRamec: number;
  vejdeSe: boolean;
  rezervaMin: number;
  varovani: string[];
};

// ===== Helpers =====

function parseHM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatHM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function delkaZapasu(faze: GenZapas["faze"], fmt: TurnajFormat): number {
  // Pravidlo na 40:40: golden = bez prirustku, star ~ +4 min, advantage ~ +6 min na zapas
  const pointBonus = fmt.scoringTyp === "cas" ? 0
    : fmt.pointRule === "advantage" ? 6
    : fmt.pointRule === "star" ? 4
    : 0;
  function odvozPodleSkore(limit: number): number {
    if (fmt.scoringTyp === "cas") return limit;
    if (fmt.scoringTyp === "gamy") return limit * 3 + 5 + pointBonus;
    return Math.round(limit * 0.45) + 5;
  }
  if (faze === "skupina" || faze === "skupina_o_umisteni") {
    return fmt.delkaSkupinaMin ?? odvozPodleSkore(fmt.scoringLimit);
  }
  if (faze === "finale" || faze === "o_3_misto" || faze === "utech_finale") {
    return fmt.delkaFinaleMin ?? odvozPodleSkore(fmt.scoringLimitPlayoff);
  }
  return fmt.delkaSemiMin ?? odvozPodleSkore(fmt.scoringLimitPlayoff);
}

// Round-robin pary (circle method). Pro liche N pridame BYE.
function roundRobinPary(tymy: TymVeSkupine[]): Array<Array<[TymVeSkupine, TymVeSkupine]>> {
  if (tymy.length < 2) return [];
  const liche = tymy.length % 2 !== 0;
  const list: (TymVeSkupine | null)[] = liche ? [...tymy, null] : [...tymy];
  const n = list.length;
  const kol = n - 1;
  const pulka = n / 2;
  const rounds: Array<Array<[TymVeSkupine, TymVeSkupine]>> = [];
  const rot = [...list];
  for (let r = 0; r < kol; r++) {
    const round: Array<[TymVeSkupine, TymVeSkupine]> = [];
    for (let i = 0; i < pulka; i++) {
      const a = rot[i], b = rot[n - 1 - i];
      if (a && b) round.push([a, b]);
    }
    rounds.push(round);
    const fixed = rot[0];
    const rest = rot.slice(1);
    rest.unshift(rest.pop()!);
    rot.splice(0, rot.length, fixed, ...rest);
  }
  return rounds;
}

// Rozdeleni N kurtu mezi P pasem.
// N >= P: souvisle bloky, kazde pasmo ma vlastni kurty.
// N < P: kazde pasmo dostane prave 1 kurt v round-robin (pasma p a p+N sdili stejny kurt
// a budou se planovat sekvencne — to je nejlepsi co lze, kdyz pasem je vic nez kurtu).
function rozdelKurty(N: number, P: number): number[][] {
  if (P <= 0) return [];
  if (N >= P) {
    const out: number[][] = [];
    for (let p = 0; p < P; p++) {
      const start = Math.floor((p * N) / P);
      const end = Math.floor(((p + 1) * N) / P);
      const arr: number[] = [];
      for (let i = start; i < end; i++) arr.push(i);
      out.push(arr);
    }
    return out;
  }
  return Array.from({ length: P }, (_, p) => [p % N]);
}

// ===== Hlavni funkce =====

export function generujRozvrh(
  fmt: TurnajFormat,
  tymyVeSkupinach: TymVeSkupine[],
): Rozvrh {
  const varovani: string[] = [];
  const zapasy: GenZapas[] = [];
  const casOdMin = parseHM(fmt.casOd);
  const casDoMin = parseHM(fmt.casDo);
  const casovyRamec = casDoMin - casOdMin;
  if (casovyRamec <= 0) {
    varovani.push("Cas konce musi byt po casu zacatku.");
    return { zapasy: [], trvaniMin: 0, casovyRamec, vejdeSe: false, rezervaMin: 0, varovani };
  }
  if (fmt.pocetKurtu < 1) {
    varovani.push("Pocet kurtu musi byt aspon 1.");
    return { zapasy: [], trvaniMin: 0, casovyRamec, vejdeSe: false, rezervaMin: 0, varovani };
  }

  const kurtVolnyOd: number[] = Array.from({ length: fmt.pocetKurtu }, () => casOdMin);

  function najdiKonecPosledni(tymId: string | null): number {
    if (!tymId) return 0;
    let max = 0;
    for (const z of zapasy) {
      if (z.tym1Id === tymId || z.tym2Id === tymId) {
        const k = parseHM(z.casKonec);
        if (k > max) max = k;
      }
    }
    return max;
  }

  function naplanuj(
    faze: GenZapas["faze"],
    skupina: string | null,
    kolo: number | null,
    entry: { tym1Id: string | null; tym2Id: string | null; tym1Label: string; tym2Label: string },
    umisteni: string | null,
    nejdrive: number,
    povoleneKurty?: number[],
    jeFinaleCela: boolean = false,
  ): GenZapas {
    const allowed = (povoleneKurty && povoleneKurty.length > 0)
      ? povoleneKurty
      : Array.from({ length: fmt.pocetKurtu }, (_, i) => i);

    // Kontrola konfliktu tymu: tym musi mit pauzu po sve posledni hre
    const tym1Konec = najdiKonecPosledni(entry.tym1Id);
    const tym2Konec = najdiKonecPosledni(entry.tym2Id);
    const minStartTymu = Math.max(
      tym1Konec > 0 ? tym1Konec + fmt.pauzaMin : 0,
      tym2Konec > 0 ? tym2Konec + fmt.pauzaMin : 0,
    );
    const minStart = Math.max(nejdrive, minStartTymu);

    // Najdi nejdrivejsi volny kurt
    let bestKurt = allowed[0];
    let bestCas = Math.max(kurtVolnyOd[bestKurt], minStart);
    for (let i = 1; i < allowed.length; i++) {
      const k = allowed[i];
      const cas = Math.max(kurtVolnyOd[k], minStart);
      if (cas < bestCas) {
        bestCas = cas;
        bestKurt = k;
      }
    }
    const trvani = delkaZapasu(faze, fmt);
    const zacatek = bestCas;
    const konec = zacatek + trvani;
    kurtVolnyOd[bestKurt] = konec + fmt.pauzaMin;
    const z: GenZapas = {
      faze, skupina, kolo,
      tym1Id: entry.tym1Id, tym2Id: entry.tym2Id,
      tym1Label: entry.tym1Label, tym2Label: entry.tym2Label,
      casZacatek: formatHM(zacatek),
      casKonec: formatHM(konec),
      kurt: bestKurt + 1,
      poradiFronta: zapasy.length + 1,
      umisteni,
      jeFinaleCela,
    };
    zapasy.push(z);
    return z;
  }

  // ===== Skupinova faze =====
  const skupinyMap = new Map<string, TymVeSkupine[]>();
  for (const t of tymyVeSkupinach) {
    const arr = skupinyMap.get(t.skupina) ?? [];
    arr.push(t);
    skupinyMap.set(t.skupina, arr);
  }
  const skupinyKlice = [...skupinyMap.keys()].sort();

  if (!fmt.bezSkupin) {
    const skupinaKola: Array<{ skupina: string; kolo: number; pary: Array<[TymVeSkupine, TymVeSkupine]> }> = [];
    for (const sk of skupinyKlice) {
      const tymy = skupinyMap.get(sk)!;
      const rounds = roundRobinPary(tymy);
      rounds.forEach((pary, idx) => {
        skupinaKola.push({ skupina: sk, kolo: idx + 1, pary });
      });
    }
    const maxKol = Math.max(0, ...skupinyKlice.map(sk => {
      const t = skupinyMap.get(sk)!;
      return t.length % 2 === 0 ? t.length - 1 : t.length;
    }));
    for (let r = 1; r <= maxKol; r++) {
      for (const sk of skupinyKlice) {
        const koloData = skupinaKola.find(k => k.skupina === sk && k.kolo === r);
        if (!koloData) continue;
        for (const [a, b] of koloData.pary) {
          naplanuj(
            "skupina", sk, r,
            { tym1Id: a.tymId, tym2Id: b.tymId, tym1Label: a.nazev, tym2Label: b.nazev },
            `Skupina ${sk} - kolo ${r}`,
            casOdMin,
          );
        }
      }
    }
  }

  const koneSkupin = zapasy.length > 0
    ? Math.max(...zapasy.map(z => parseHM(z.casKonec)))
    : casOdMin;
  const playoffStart = fmt.bezSkupin ? casOdMin : koneSkupin + fmt.pauzaMin;

  // ===== Playoff =====
  const tymuCelkem = tymyVeSkupinach.length;

  // Pro bezSkupin == true: zname uz konkretni tymy hned (nasazeni urcuje poradi).
  // Pro normalni rezim: placeholdery typu "1.A", "2.B" (vitez skupiny se doplni po skupinach).
  const tymyPodleNasazeni = tymyVeSkupinach.slice().sort((a, b) => {
    if (a.skupina === b.skupina) return a.nasazeni - b.nasazeni;
    return a.skupina.localeCompare(b.skupina);
  });
  function tymPro(idx: number): { id: string | null; label: string } {
    if (fmt.bezSkupin && idx < tymyPodleNasazeni.length) {
      const t = tymyPodleNasazeni[idx];
      return { id: t.tymId, label: t.nazev };
    }
    return { id: null, label: `${idx + 1}.` };
  }

  type OdlozeneFinale = {
    faze: GenZapas["faze"];
    entry: { tym1Id: string | null; tym2Id: string | null; tym1Label: string; tym2Label: string };
    umisteni: string;
    kolo: number;
    nejdriveStart: number;
    povoleneKurty: number[];
  };
  let finaleCela: OdlozeneFinale | null = null;

  if (fmt.playoffMode === "medaile") {
    const allKurty = Array.from({ length: fmt.pocetKurtu }, (_, i) => i);
    let semi1Entry: { tym1Id: string | null; tym2Id: string | null; tym1Label: string; tym2Label: string };
    let semi2Entry: typeof semi1Entry;
    if (fmt.bezSkupin) {
      const t1 = tymPro(0), t4 = tymPro(3), t2 = tymPro(1), t3 = tymPro(2);
      semi1Entry = { tym1Id: t1.id, tym2Id: t4.id, tym1Label: t1.label, tym2Label: t4.label };
      semi2Entry = { tym1Id: t2.id, tym2Id: t3.id, tym1Label: t2.label, tym2Label: t3.label };
    } else {
      const sA = skupinyKlice[0] ?? "A";
      const sB = skupinyKlice[1] ?? sA;
      semi1Entry = { tym1Id: null, tym2Id: null, tym1Label: `1.${sA}`, tym2Label: `2.${sB}` };
      semi2Entry = { tym1Id: null, tym2Id: null, tym1Label: `1.${sB}`, tym2Label: `2.${sA}` };
    }
    const s1 = naplanuj("semifinale", null, 1, semi1Entry, "Semifinale 1", playoffStart, allKurty);
    const s2 = naplanuj("semifinale", null, 1, semi2Entry, "Semifinale 2", playoffStart, allKurty);
    const poSemi = Math.max(parseHM(s1.casKonec), parseHM(s2.casKonec)) + fmt.pauzaMin;
    naplanuj("o_3_misto", null, 2,
      { tym1Id: null, tym2Id: null, tym1Label: "Porazeny S1", tym2Label: "Porazeny S2" },
      "O 3. misto", poSemi, allKurty);
    finaleCela = {
      faze: "finale",
      entry: { tym1Id: null, tym2Id: null, tym1Label: "Vitez S1", tym2Label: "Vitez S2" },
      umisteni: "Finale",
      kolo: 2,
      nejdriveStart: poSemi,
      povoleneKurty: allKurty,
    };
  } else if (fmt.playoffMode === "vitez") {
    // Single elim bracket
    let bs: number;
    if (fmt.vitezBracket === "top4") bs = 4;
    else if (fmt.vitezBracket === "top8") bs = 8;
    else if (fmt.vitezBracket === "top16") bs = 16;
    else { bs = 2; while (bs * 2 <= tymuCelkem && bs < 16) bs *= 2; }
    while (bs > tymuCelkem && bs > 2) bs /= 2;
    const allKurty = Array.from({ length: fmt.pocetKurtu }, (_, i) => i);

    let participants: Array<{ id: string | null; label: string }> = [];
    if (fmt.bezSkupin) {
      // Standardni single elim parovani: 1 vs bs, 2 vs bs-1, 3 vs bs-2 atd.
      // Tym s vyssim nasazenim hraje s tymem s nizsim.
      for (let i = 0; i < bs / 2; i++) {
        participants.push(tymPro(i));
        participants.push(tymPro(bs - 1 - i));
      }
    } else {
      for (let i = 0; i < bs; i++) {
        const sk = skupinyKlice[i % Math.max(1, skupinyKlice.length)] ?? "A";
        const poradi = Math.floor(i / Math.max(1, skupinyKlice.length)) + 1;
        participants.push({ id: null, label: `${poradi}.${sk}` });
      }
    }
    const fazePodleVelikosti: Record<number, GenZapas["faze"]> = {
      2: "finale", 4: "semifinale", 8: "ctvrtfinale", 16: "playoff",
    };
    let kolo = 1;
    let kdyMuze = playoffStart;
    while (participants.length > 1) {
      const faze = fazePodleVelikosti[participants.length] ?? "playoff";
      const noveKolo: Array<{ id: string | null; label: string }> = [];
      const koloMatches: GenZapas[] = [];
      const jeFinaleKolo = participants.length === 2;
      for (let i = 0; i < participants.length; i += 2) {
        const a = participants[i], b = participants[i + 1];
        if (jeFinaleKolo) {
          // Odloz finale cela
          finaleCela = {
            faze: "finale",
            entry: { tym1Id: a.id, tym2Id: b.id, tym1Label: a.label, tym2Label: b.label },
            umisteni: "Finale",
            kolo,
            nejdriveStart: kdyMuze,
            povoleneKurty: allKurty,
          };
          noveKolo.push({ id: null, label: "Vitez" });
        } else {
          const z = naplanuj(faze, null, kolo,
            { tym1Id: a.id, tym2Id: b.id, tym1Label: a.label, tym2Label: b.label },
            faze === "semifinale" ? `Semifinale ${i / 2 + 1}` :
            faze === "ctvrtfinale" ? `Ctvrtfinale ${i / 2 + 1}` :
            `Playoff K${kolo} #${i / 2 + 1}`,
            kdyMuze, allKurty);
          koloMatches.push(z);
          noveKolo.push({ id: null, label: `Vitez ${faze === "ctvrtfinale" ? "CF" : faze === "semifinale" ? "SF" : "PL"} ${i / 2 + 1}` });
        }
      }
      if (koloMatches.length > 0) {
        kdyMuze = Math.max(...koloMatches.map(z => parseHM(z.casKonec))) + fmt.pauzaMin;
      }
      participants = noveKolo;
      kolo++;
    }
  } else if (fmt.playoffMode === "skupiny_o_umisteni" && !fmt.bezSkupin) {
    // Druha faze: nove skupiny zachovavaji puvodni velikost (V).
    // Pocet novych skupin = ceil(N / V).
    // Distribuce: globalni ranking [1A, 1B, ..., 2A, 2B, ..., 3A, ...]
    // -> rozdeleny po V tymech do novych skupin.
    type NovyTym = { tymId: string | null; label: string };
    const maxVel = Math.max(0, ...skupinyKlice.map(sk => skupinyMap.get(sk)!.length));
    const novaVelikost = Math.max(2, maxVel);
    const ranking: NovyTym[] = [];
    for (let pozice = 1; pozice <= maxVel; pozice++) {
      for (const sk of skupinyKlice) {
        const tymyVeSk = skupinyMap.get(sk)!;
        if (tymyVeSk.length >= pozice) {
          ranking.push({ tymId: null, label: `${pozice}.${sk}` });
        }
      }
    }
    const noveSkupiny: NovyTym[][] = [];
    for (let i = 0; i < ranking.length; i += novaVelikost) {
      noveSkupiny.push(ranking.slice(i, i + novaVelikost));
    }
    const pocetNovych = noveSkupiny.length;
    const kurtyPerPasmo = rozdelKurty(fmt.pocetKurtu, pocetNovych);
    function rrPary<T>(items: T[]): Array<[T, T]> {
      const pary: Array<[T, T]> = [];
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) pary.push([items[i], items[j]]);
      }
      return pary;
    }
    noveSkupiny.forEach((novaSkupina, ni) => {
      if (novaSkupina.length < 2) return;
      const od = ni * novaVelikost + 1;
      const doMisto = od + novaSkupina.length - 1;
      const label = `Skupina o ${od}.-${doMisto}. místo`;
      const skupinaKey = `o-${ni + 1}`;
      const pary = rrPary(novaSkupina);
      const kurty = kurtyPerPasmo[ni];
      pary.forEach((p, idx) => {
        naplanuj("skupina_o_umisteni", skupinaKey, idx + 1,
          { tym1Id: p[0].tymId, tym2Id: p[1].tymId, tym1Label: p[0].label, tym2Label: p[1].label },
          `${label} - kolo ${idx + 1}`, playoffStart, kurty);
      });
    });
  } else if (fmt.playoffMode === "umisteni") {
    // Multi-tier: kazde pasmo 4 tymy -> mini-bracket. Pasma bezi PARALELNE
    // na rozdelenych kurtech. Finale celniho pasma se ODLOZI jako posledni.
    const pocetPasem = Math.ceil(tymuCelkem / 4);
    const kurtyPerPasmo = rozdelKurty(fmt.pocetKurtu, pocetPasem);

    for (let p = 0; p < pocetPasem; p++) {
      const tymyPasma = Math.min(4, tymuCelkem - p * 4);
      if (tymyPasma < 2) continue;
      const labelPasma = pocetPasem === 1 ? "" : ` (${p * 4 + 1}.-${p * 4 + tymyPasma}.)`;
      const kurty = kurtyPerPasmo[p];

      if (tymyPasma === 4) {
        const t1 = tymPro(p * 4 + 0), t4 = tymPro(p * 4 + 3);
        const t2 = tymPro(p * 4 + 1), t3 = tymPro(p * 4 + 2);
        const s1 = naplanuj("semifinale", null, p * 10 + 1,
          { tym1Id: t1.id, tym2Id: t4.id, tym1Label: t1.label, tym2Label: t4.label },
          `Semi 1${labelPasma}`, playoffStart, kurty);
        const s2 = naplanuj("semifinale", null, p * 10 + 1,
          { tym1Id: t2.id, tym2Id: t3.id, tym1Label: t2.label, tym2Label: t3.label },
          `Semi 2${labelPasma}`, playoffStart, kurty);
        const poSemi = Math.max(parseHM(s1.casKonec), parseHM(s2.casKonec)) + fmt.pauzaMin;
        naplanuj("o_3_misto", null, p * 10 + 2,
          { tym1Id: null, tym2Id: null, tym1Label: "Porazeny S1", tym2Label: "Porazeny S2" },
          `O ${p * 4 + 3}. misto${labelPasma}`, poSemi, kurty);
        if (p === 0) {
          // Finale cela — odlozit
          finaleCela = {
            faze: "finale",
            entry: { tym1Id: null, tym2Id: null, tym1Label: "Vitez S1", tym2Label: "Vitez S2" },
            umisteni: `Finale${labelPasma}`,
            kolo: p * 10 + 2,
            nejdriveStart: poSemi,
            povoleneKurty: Array.from({ length: fmt.pocetKurtu }, (_, i) => i),
          };
        } else {
          naplanuj("finale", null, p * 10 + 2,
            { tym1Id: null, tym2Id: null, tym1Label: "Vitez S1", tym2Label: "Vitez S2" },
            `Finale${labelPasma}`, poSemi, kurty);
        }
      } else if (tymyPasma === 3 || tymyPasma === 2) {
        const t1 = tymPro(p * 4 + 0), t2 = tymPro(p * 4 + 1);
        const entry = { tym1Id: t1.id, tym2Id: t2.id, tym1Label: t1.label, tym2Label: t2.label };
        const z = naplanuj("finale", null, p * 10 + 1, entry,
          `O ${p * 4 + 1}. misto${labelPasma}`, playoffStart, kurty);
        if (p === 0) {
          zapasy.pop();
          kurtVolnyOd[z.kurt - 1] = parseHM(z.casZacatek);
          finaleCela = {
            faze: "finale", entry,
            umisteni: `Finale${labelPasma}`,
            kolo: p * 10 + 1,
            nejdriveStart: playoffStart,
            povoleneKurty: Array.from({ length: fmt.pocetKurtu }, (_, i) => i),
          };
        }
      }
    }
  }

  // ===== Utechovy pavouk (paralelne s playoff) =====
  if (fmt.utechovyPavouk && (fmt.playoffMode === "medaile" || fmt.playoffMode === "vitez")) {
    const prvniKolo = zapasy.filter(z =>
      (z.faze === "semifinale" && fmt.playoffMode === "medaile") ||
      (z.faze === "ctvrtfinale" && fmt.playoffMode === "vitez") ||
      (z.faze === "playoff" && fmt.playoffMode === "vitez"),
    );
    if (prvniKolo.length >= 2) {
      const start = Math.min(...prvniKolo.map(z => parseHM(z.casKonec))) + fmt.pauzaMin;
      const allKurty = Array.from({ length: fmt.pocetKurtu }, (_, i) => i);
      const porazene = prvniKolo.map((_, i) => `Porazeny ${i + 1}`);
      const utechMatches: GenZapas[] = [];
      const dalsi: string[] = [];
      for (let i = 0; i < porazene.length - 1; i += 2) {
        const z = naplanuj("utech_1", null, 1,
          { tym1Id: null, tym2Id: null, tym1Label: porazene[i], tym2Label: porazene[i + 1] },
          `Utech 1. kolo`, start, allKurty);
        utechMatches.push(z);
        dalsi.push(`Vitez utech ${i / 2 + 1}`);
      }
      let kdyMuze = utechMatches.length > 0
        ? Math.max(...utechMatches.map(z => parseHM(z.casKonec))) + fmt.pauzaMin
        : start;
      let kolo = 2;
      let participants = dalsi;
      while (participants.length > 1) {
        const koloMatches: GenZapas[] = [];
        const next: string[] = [];
        for (let i = 0; i < participants.length - 1; i += 2) {
          const faze: GenZapas["faze"] = participants.length === 2 ? "utech_finale" : "utech_2";
          const z = naplanuj(faze, null, kolo,
            { tym1Id: null, tym2Id: null, tym1Label: participants[i], tym2Label: participants[i + 1] },
            faze === "utech_finale" ? "Utechove finale" : `Utech ${kolo}. kolo`,
            kdyMuze, allKurty);
          koloMatches.push(z);
          next.push(`Vitez utech K${kolo} ${i / 2 + 1}`);
        }
        if (koloMatches.length === 0) break;
        kdyMuze = Math.max(...koloMatches.map(z => parseHM(z.casKonec))) + fmt.pauzaMin;
        participants = next;
        kolo++;
      }
    }
  }

  // ===== Finale cela (posledni zapas turnaje) =====
  // Finale ma nejdrivejsi start = po dohrani svych semifinále (+ pauza),
  // ne nutne po VSECH ostatnich zapasech. Naplanuj umisti na nejdrive
  // volny kurt — typicky paralelne s O3 / finale nizsich pasem.
  // "Finale posledni" znamena: ma rezervovany slot v ramci playoff
  // a koncuje stejne pozde nebo pozdeji nez ostatni (delkaFinaleMin = max).
  if (finaleCela) {
    naplanuj(
      finaleCela.faze,
      null,
      finaleCela.kolo,
      finaleCela.entry,
      finaleCela.umisteni,
      finaleCela.nejdriveStart,
      finaleCela.povoleneKurty,
      true, // jeFinaleCela
    );
  }

  // ===== Vyhodnoceni =====
  const konecPosledniho = zapasy.length > 0
    ? Math.max(...zapasy.map(z => parseHM(z.casKonec)))
    : casOdMin;
  const trvaniMin = konecPosledniho - casOdMin;
  const rezervaMin = casDoMin - konecPosledniho;
  const vejdeSe = rezervaMin >= 0;
  if (!vejdeSe) {
    varovani.push(`Turnaj prekracuje cas o ${Math.abs(rezervaMin)} min. Zkrat delku zapasu, pridej kurt nebo posun konec.`);
  } else if (rezervaMin < 5) {
    varovani.push(`Velmi tesna rezerva (${rezervaMin} min) — doporucujeme alespon 5 min na vyhlaseni.`);
  }

  return { zapasy, trvaniMin, casovyRamec, vejdeSe, rezervaMin, varovani };
}
