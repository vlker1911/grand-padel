// Engine pro generovani rozvrhu turnaje s casy a kurty.
// Bere konfiguraci (settings) + seznam tymu rozdelenych do skupin a vraci
// kompletni rozvrh: kdy, na kterem kurtu a v jake fazi se hraje.

export type PlayoffMode = "bez" | "medaile" | "vitez" | "umisteni";
export type ScoringTyp = "gamy" | "body" | "cas";
export type VitezBracket = "auto" | "top4" | "top8" | "top16";

export type TurnajFormat = {
  scoringTyp: ScoringTyp;
  scoringLimit: number;
  scoringLimitPlayoff: number;
  playoffMode: PlayoffMode;
  vitezBracket: VitezBracket;
  utechovyPavouk: boolean;
  pocetKurtu: number;
  casOd: string;          // "HH:MM"
  casDo: string;          // "HH:MM"
  // Delky v minutach. Pokud null -> odvozeno ze scoringTyp/Limit.
  delkaSkupinaMin: number | null;
  delkaSemiMin: number | null;
  delkaFinaleMin: number | null;
  pauzaMin: number;
};

export type TymVeSkupine = {
  tymId: string;          // id z turnaj_tymy
  nazev: string;
  skupina: string;        // "A", "B", ...
  nasazeni: number;       // poradi ve skupine
};

export type GenZapas = {
  faze: "skupina" | "ctvrtfinale" | "semifinale" | "finale" | "o_3_misto" |
        "playoff" | "utech_1" | "utech_2" | "utech_finale";
  skupina: string | null;
  kolo: number | null;
  tym1Id: string | null;     // null = placeholder ("vitez semi 1")
  tym2Id: string | null;
  tym1Label: string;          // pro placeholdery: "Vitez S1", "2.A", ...
  tym2Label: string;
  casZacatek: string;         // "HH:MM"
  casKonec: string;           // "HH:MM"
  kurt: number;
  poradiFronta: number;       // globalni poradi
  umisteni: string | null;    // "Final", "O 3. misto", "1. utechove kolo", ...
};

export type Rozvrh = {
  zapasy: GenZapas[];
  trvaniMin: number;          // delka od cas_od do konce posledniho zapasu
  casovyRamec: number;        // cas_do - cas_od v minutach
  vejdeSe: boolean;
  rezervaMin: number;         // kladne = rezerva, zaporne = prekroceni
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

function delkaZapasu(
  faze: GenZapas["faze"],
  fmt: TurnajFormat,
): number {
  // Vychozi odhad podle scoringTyp.
  function odvozPodleSkore(limit: number): number {
    if (fmt.scoringTyp === "cas") return limit;
    if (fmt.scoringTyp === "gamy") return limit * 3 + 5;
    // body: ~0.45 min/bod + 5 rezerva
    return Math.round(limit * 0.45) + 5;
  }
  const limitPlayoff = fmt.scoringLimitPlayoff;
  const limitSkupina = fmt.scoringLimit;
  if (faze === "skupina") {
    return fmt.delkaSkupinaMin ?? odvozPodleSkore(limitSkupina);
  }
  if (faze === "finale" || faze === "o_3_misto" || faze === "utech_finale") {
    return fmt.delkaFinaleMin ?? odvozPodleSkore(limitPlayoff);
  }
  if (faze === "semifinale" || faze === "ctvrtfinale" || faze === "playoff" ||
      faze === "utech_1" || faze === "utech_2") {
    return fmt.delkaSemiMin ?? odvozPodleSkore(limitPlayoff);
  }
  return odvozPodleSkore(limitPlayoff);
}

// Round-robin (circle method) pro skupinu s N tymy: vraci poradi paru.
// Pro liche N pridame "BYE" placeholder a vyfiltrujeme.
function roundRobinPary(tymy: TymVeSkupine[]): Array<Array<[TymVeSkupine, TymVeSkupine]>> {
  const liche = tymy.length % 2 !== 0;
  const list = liche ? [...tymy, null as TymVeSkupine | null] : [...tymy];
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
    // rotace: prvni fixni, ostatni se posunou
    const fixed = rot[0];
    const rest = rot.slice(1);
    rest.unshift(rest.pop()!);
    rot.splice(0, rot.length, fixed, ...rest);
  }
  return rounds;
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

  // Stav kurtu: kdy je dany kurt znovu volny.
  const kurtVolnyOd: number[] = Array.from({ length: fmt.pocetKurtu }, () => casOdMin);

  function naplanuj(
    faze: GenZapas["faze"],
    skupina: string | null,
    kolo: number | null,
    paramEntry: { tym1Id: string | null; tym2Id: string | null; tym1Label: string; tym2Label: string },
    umisteni: string | null,
    nejdrive: number, // nejdrivejsi cas zacatku (kvuli zavislosti na predchozim zapase)
  ): GenZapas {
    // Najdi nejdriv volny kurt + cas
    let bestKurt = 0;
    let bestCas = Math.max(kurtVolnyOd[0], nejdrive);
    for (let k = 1; k < fmt.pocetKurtu; k++) {
      const cas = Math.max(kurtVolnyOd[k], nejdrive);
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
      faze,
      skupina,
      kolo,
      tym1Id: paramEntry.tym1Id,
      tym2Id: paramEntry.tym2Id,
      tym1Label: paramEntry.tym1Label,
      tym2Label: paramEntry.tym2Label,
      casZacatek: formatHM(zacatek),
      casKonec: formatHM(konec),
      kurt: bestKurt + 1,
      poradiFronta: zapasy.length + 1,
      umisteni,
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

  // Pro kazdou skupinu spocti kola (circle method)
  const skupinaKola: Array<{ skupina: string; kolo: number; pary: Array<[TymVeSkupine, TymVeSkupine]> }> = [];
  for (const sk of skupinyKlice) {
    const tymy = skupinyMap.get(sk)!;
    const rounds = roundRobinPary(tymy);
    rounds.forEach((pary, idx) => {
      skupinaKola.push({ skupina: sk, kolo: idx + 1, pary });
    });
  }

  // Naplanujeme zapasy podle kol (vsechna kola skupiny A, pak B, ...).
  // Jednodussi alternativa: prokladat kola napric skupinami pro lepsi vyuziti kurtu.
  // Pouzijme prokladani: vezmeme max(kola) a iterujeme po kolech.
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
          "skupina",
          sk,
          r,
          { tym1Id: a.tymId, tym2Id: b.tymId, tym1Label: a.nazev, tym2Label: b.nazev },
          `Skupina ${sk} - kolo ${r}`,
          casOdMin,
        );
      }
    }
  }

  // Cas, kdy je dohrana skupinova faze (max konec zapasu skupiny)
  const koneSkupin = zapasy.length > 0
    ? Math.max(...zapasy.map(z => parseHM(z.casKonec)))
    : casOdMin;

  // ===== Playoff =====
  const tymuCelkem = tymyVeSkupinach.length;
  function playoffStart() { return koneSkupin + fmt.pauzaMin; }

  if (fmt.playoffMode === "medaile") {
    // Final Four: 2 semi (1A vs 2B, 1B vs 2A pokud 2 skupiny; jinak top4) + finale + o 3.
    // Pro nedostatek info: pouzijeme placeholdery z poradi ve skupinach.
    const semi: GenZapas[] = [];
    if (skupinyKlice.length >= 2) {
      const sA = skupinyKlice[0], sB = skupinyKlice[1];
      const s1 = naplanuj("semifinale", null, 1,
        { tym1Id: null, tym2Id: null, tym1Label: `1.${sA}`, tym2Label: `2.${sB}` },
        "Semifinale 1", playoffStart());
      const s2 = naplanuj("semifinale", null, 1,
        { tym1Id: null, tym2Id: null, tym1Label: `1.${sB}`, tym2Label: `2.${sA}` },
        "Semifinale 2", playoffStart());
      semi.push(s1, s2);
    } else {
      const s1 = naplanuj("semifinale", null, 1,
        { tym1Id: null, tym2Id: null, tym1Label: "1.A", tym2Label: "4.A" },
        "Semifinale 1", playoffStart());
      const s2 = naplanuj("semifinale", null, 1,
        { tym1Id: null, tym2Id: null, tym1Label: "2.A", tym2Label: "3.A" },
        "Semifinale 2", playoffStart());
      semi.push(s1, s2);
    }
    const poSemi = Math.max(...semi.map(z => parseHM(z.casKonec))) + fmt.pauzaMin;
    naplanuj("o_3_misto", null, 2,
      { tym1Id: null, tym2Id: null, tym1Label: "Porazeny S1", tym2Label: "Porazeny S2" },
      "O 3. misto", poSemi);
    naplanuj("finale", null, 2,
      { tym1Id: null, tym2Id: null, tym1Label: "Vitez S1", tym2Label: "Vitez S2" },
      "Finale", poSemi);
  } else if (fmt.playoffMode === "vitez") {
    // Single elim, bracket size podle volby (auto = nejvetsi 2^k <= n, max 16)
    let bs: number;
    if (fmt.vitezBracket === "top4") bs = 4;
    else if (fmt.vitezBracket === "top8") bs = 8;
    else if (fmt.vitezBracket === "top16") bs = 16;
    else { bs = 2; while (bs * 2 <= tymuCelkem && bs < 16) bs *= 2; }
    while (bs > tymuCelkem && bs > 2) bs /= 2;

    let participants: Array<{ id: string | null; label: string }> = [];
    for (let i = 0; i < bs; i++) {
      // Nasazeni 1..bs pres vsechny skupiny (placeholder)
      const sk = skupinyKlice[i % skupinyKlice.length];
      const poradi = Math.floor(i / skupinyKlice.length) + 1;
      participants.push({ id: null, label: `${poradi}.${sk ?? "A"}` });
    }

    let kolo = 1;
    let kdyMuze = playoffStart();
    const fazePodleVelikosti: Record<number, GenZapas["faze"]> = {
      2: "finale", 4: "semifinale", 8: "ctvrtfinale", 16: "playoff",
    };
    while (participants.length > 1) {
      const faze = fazePodleVelikosti[participants.length] ?? "playoff";
      const noveKolo: Array<{ id: string | null; label: string }> = [];
      const koloMatches: GenZapas[] = [];
      for (let i = 0; i < participants.length; i += 2) {
        const a = participants[i], b = participants[i + 1];
        const z = naplanuj(faze, null, kolo,
          { tym1Id: a.id, tym2Id: b.id, tym1Label: a.label, tym2Label: b.label },
          faze === "finale" ? "Finale" : faze === "semifinale" ? `Semifinale ${i/2 + 1}` : `Playoff K${kolo} #${i/2 + 1}`,
          kdyMuze);
        koloMatches.push(z);
        noveKolo.push({ id: null, label: `Vitez ${faze === "ctvrtfinale" ? "CF" : faze === "semifinale" ? "SF" : "PL"} ${i/2 + 1}` });
      }
      kdyMuze = Math.max(...koloMatches.map(z => parseHM(z.casKonec))) + fmt.pauzaMin;
      participants = noveKolo;
      kolo++;
    }
  } else if (fmt.playoffMode === "umisteni") {
    // Multi-tier: kazde pasmo 4 tymy -> mini-bracket (1v4, 2v3, finale, o 3.)
    const pocetPasem = Math.ceil(tymuCelkem / 4);
    let kdyMuze = playoffStart();
    for (let p = 0; p < pocetPasem; p++) {
      const tymyPasma = Math.min(4, tymuCelkem - p * 4);
      if (tymyPasma < 2) continue;
      const labelPasma = pocetPasem === 1 ? "" : ` (${p * 4 + 1}.-${p * 4 + tymyPasma}.)`;
      if (tymyPasma === 4) {
        const s1 = naplanuj("semifinale", null, p * 10 + 1,
          { tym1Id: null, tym2Id: null, tym1Label: `${p * 4 + 1}.`, tym2Label: `${p * 4 + 4}.` },
          `Semi 1${labelPasma}`, kdyMuze);
        const s2 = naplanuj("semifinale", null, p * 10 + 1,
          { tym1Id: null, tym2Id: null, tym1Label: `${p * 4 + 2}.`, tym2Label: `${p * 4 + 3}.` },
          `Semi 2${labelPasma}`, kdyMuze);
        const poSemi = Math.max(parseHM(s1.casKonec), parseHM(s2.casKonec)) + fmt.pauzaMin;
        naplanuj("o_3_misto", null, p * 10 + 2,
          { tym1Id: null, tym2Id: null, tym1Label: "Porazeny S1", tym2Label: "Porazeny S2" },
          `O ${p * 4 + 3}. misto${labelPasma}`, poSemi);
        const f = naplanuj("finale", null, p * 10 + 2,
          { tym1Id: null, tym2Id: null, tym1Label: "Vitez S1", tym2Label: "Vitez S2" },
          `Finale${labelPasma}`, poSemi);
        kdyMuze = parseHM(f.casKonec) + fmt.pauzaMin;
      } else if (tymuCelkem >= 2) {
        const z = naplanuj("finale", null, p * 10 + 1,
          { tym1Id: null, tym2Id: null, tym1Label: `${p * 4 + 1}.`, tym2Label: `${p * 4 + 2}.` },
          `O ${p * 4 + 1}. misto${labelPasma}`, kdyMuze);
        kdyMuze = parseHM(z.casKonec) + fmt.pauzaMin;
      }
    }
  }

  // ===== Utechovy pavouk =====
  // Hraji ho porazeni z prvniho kola playoff (medaile/vitez) — paralelne s dalsim kolem.
  if (fmt.utechovyPavouk && (fmt.playoffMode === "medaile" || fmt.playoffMode === "vitez")) {
    // Najdi poraze pavouka 1. kola
    const prvniKolo = zapasy.filter(z =>
      (z.faze === "semifinale" && fmt.playoffMode === "medaile") ||
      (z.faze === "ctvrtfinale" && fmt.playoffMode === "vitez") ||
      (z.faze === "playoff" && fmt.playoffMode === "vitez"),
    );
    if (prvniKolo.length >= 2) {
      const start = Math.min(...prvniKolo.map(z => parseHM(z.casKonec))) + fmt.pauzaMin;
      // Spary porazene: 1 vs 2, 3 vs 4 atd.
      let kdyMuze = start;
      const porazene = prvniKolo.map((_, i) => `Porazeny ${i + 1}`);
      // Prvni kolo utechoveho pavouka
      const utechMatches: GenZapas[] = [];
      const dalsi: string[] = [];
      for (let i = 0; i < porazene.length - 1; i += 2) {
        const z = naplanuj("utech_1", null, 1,
          { tym1Id: null, tym2Id: null, tym1Label: porazene[i], tym2Label: porazene[i + 1] },
          `Utech 1. kolo`, kdyMuze);
        utechMatches.push(z);
        dalsi.push(`Vitez utech ${i / 2 + 1}`);
      }
      if (utechMatches.length > 0) {
        kdyMuze = Math.max(...utechMatches.map(z => parseHM(z.casKonec))) + fmt.pauzaMin;
      }
      // Dalsi kola utechoveho pavouka (pokud >=2 vitezove)
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
            kdyMuze);
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
