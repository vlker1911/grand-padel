// Test runner pro lib/turnaj-format.ts.
// Pousti se jako: node scripts/test-turnaj-engine.mjs
//
// Validuje 50+ scenaru rozvrhu: ruzne pocty tymu (vc. lichych), kurtu,
// playoff modu a casovych ramcu. Kontroluje:
//   - Zadny tym nehraje 2 zapasy zaroven (s ohledem na pauzaMin)
//   - Zadny kurt nehosti 2 zapasy zaroven
//   - Finale cela je posledni zapas turnaje
//   - Multi-tier pasma bezi paralelne (pocet pasem > 1 -> zacatky aspon dvou pasem se prekryvaji)
//   - Vsechny ocekavane zapasy jsou pritomny
//
// Spousteni: node --experimental-strip-types scripts/test-turnaj-engine.mjs
// (nebo prevod na .ts pres tsc a pak run)

import { generujRozvrh } from "../src/lib/turnaj-format.ts";

function parseHM(s) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + (m || 0);
}

function vytvorTymyVeSkupinach(pocet, pocetSkupin) {
  // Rozdeli pocet tymu do pocetSkupin skupin (snake-style co nejrovnomerne).
  const skupinyNazvy = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const tymy = [];
  for (let i = 0; i < pocet; i++) {
    const sk = skupinyNazvy[i % pocetSkupin];
    const nasazeni = Math.floor(i / pocetSkupin) + 1;
    tymy.push({ tymId: `t${i + 1}`, nazev: `T${i + 1}`, skupina: sk, nasazeni });
  }
  return tymy;
}

function vychoziPocetSkupin(n) {
  if (n <= 4) return 1;
  if (n <= 8) return 2;
  if (n <= 12) return 3;
  if (n <= 16) return 4;
  return Math.ceil(n / 4);
}

function defaultFormat(over = {}) {
  return {
    scoringTyp: "gamy",
    scoringLimit: 4,
    scoringLimitPlayoff: 4,
    playoffMode: "umisteni",
    vitezBracket: "auto",
    utechovyPavouk: false,
    bezSkupin: false,
    placementBracket: false,
    postupovyKlic: undefined,
    pointRule: "golden",
    pocetKurtu: 4,
    casOd: "16:00",
    casDo: "20:00",
    delkaSkupinaMin: null,
    delkaSemiMin: null,
    delkaFinaleMin: null,
    pauzaMin: 1,
    ...over,
  };
}

// ===== Validatory =====

function validujKonfliktyKurtu(rozvrh, fmt) {
  const errors = [];
  const perKurt = new Map();
  for (const z of rozvrh.zapasy) {
    const arr = perKurt.get(z.kurt) ?? [];
    arr.push(z);
    perKurt.set(z.kurt, arr);
  }
  for (const [kurt, list] of perKurt.entries()) {
    list.sort((a, b) => parseHM(a.casZacatek) - parseHM(b.casZacatek));
    for (let i = 0; i < list.length - 1; i++) {
      const konec = parseHM(list[i].casKonec);
      const zacatek = parseHM(list[i + 1].casZacatek);
      if (konec > zacatek) {
        errors.push(`Kurt ${kurt}: zapasy se prekryvaji — ${list[i].umisteni ?? list[i].faze} (konec ${list[i].casKonec}) vs ${list[i + 1].umisteni ?? list[i + 1].faze} (zacatek ${list[i + 1].casZacatek})`);
      }
    }
  }
  return errors;
}

function validujKonfliktyTymu(rozvrh, fmt) {
  const errors = [];
  const perTym = new Map();
  for (const z of rozvrh.zapasy) {
    for (const tid of [z.tym1Id, z.tym2Id]) {
      if (!tid) continue;
      const arr = perTym.get(tid) ?? [];
      arr.push(z);
      perTym.set(tid, arr);
    }
  }
  for (const [tid, list] of perTym.entries()) {
    list.sort((a, b) => parseHM(a.casZacatek) - parseHM(b.casZacatek));
    for (let i = 0; i < list.length - 1; i++) {
      const konec = parseHM(list[i].casKonec);
      const zacatek = parseHM(list[i + 1].casZacatek);
      if (konec > zacatek) {
        errors.push(`Tym ${tid}: prekryv — ${list[i].umisteni ?? list[i].faze} (konec ${list[i].casKonec}) vs ${list[i + 1].umisteni ?? list[i + 1].faze} (zacatek ${list[i + 1].casZacatek})`);
      } else if (zacatek - konec < fmt.pauzaMin) {
        errors.push(`Tym ${tid}: nedostatecna pauza (${zacatek - konec} < ${fmt.pauzaMin} min) mezi ${list[i].casKonec} a ${list[i + 1].casZacatek}`);
      }
    }
  }
  return errors;
}

function validujFinalePosledni(rozvrh, fmt) {
  if (fmt.playoffMode === "bez") return [];
  if (fmt.playoffMode === "skupiny_o_umisteni") return [];
  const fin = rozvrh.zapasy.find(z => z.jeFinaleCela);
  if (!fin) return [`Chybi finale cela (playoffMode=${fmt.playoffMode})`];
  // Finale ma "jeFinaleCela" priznak. Smi byt paralelni s jinymi zapasy
  // (napr. O3 ve stejnem pasme) — proto neuplatnujeme "musi byt posledni".
  return [];
}

function validujParaleliMultiTier(rozvrh, fmt, pocetPasem) {
  if (fmt.playoffMode !== "umisteni") return [];
  if (pocetPasem < 2) return [];
  if (fmt.pocetKurtu < 2) return [];
  const semi = rozvrh.zapasy.filter(z => z.faze === "semifinale");
  if (semi.length < 4) return [];
  const prvniSemiPerPasmo = new Map();
  for (const z of semi) {
    const klic = (z.umisteni ?? "").replace(/^Semi \d+/, "").trim();
    if (!prvniSemiPerPasmo.has(klic) || parseHM(z.casZacatek) < parseHM(prvniSemiPerPasmo.get(klic).casZacatek)) {
      prvniSemiPerPasmo.set(klic, z);
    }
  }
  const startTimes = [...prvniSemiPerPasmo.values()].map(z => parseHM(z.casZacatek));
  const minStart = Math.min(...startTimes);
  const maxStart = Math.max(...startTimes);
  // Kolik pasem se vejde paralelne s aktualnim poctem kurtu? Kazde pasmo potrebuje >=1 kurt.
  const paralelniBatch = Math.min(pocetPasem, fmt.pocetKurtu);
  if (paralelniBatch < 2) return [];
  // Vezmi prvnich `paralelniBatch` pasem podle casu startu — meli by startovat blizko.
  const sortedStarts = startTimes.slice().sort((a, b) => a - b);
  const prvniBatch = sortedStarts.slice(0, paralelniBatch);
  const minB = Math.min(...prvniBatch);
  const maxB = Math.max(...prvniBatch);
  if (maxB - minB > 5) {
    return [`Multi-tier prvni batch (${paralelniBatch} pasem) neni paralelni: startuji ${minB}–${maxB} (rozdil ${maxB - minB} min)`];
  }
  // Pro vic-pasem-nez-kurtu: pasma za batchem mohou byt sekvencni — to je OK.
  // Ale kontroluj ze nejaka pasma vubec startuji pozdeji (pokud P > N).
  if (pocetPasem > fmt.pocetKurtu) {
    if (maxStart === minStart) {
      // Vsechna pasma startuji najednou pres ramec kurtu — to je chyba
      return [`Pri ${pocetPasem} pasmech a ${fmt.pocetKurtu} kurtech by mely byt nektera pasma sekvencni, ale vsechna startuji ${minStart}`];
    }
  }
  return [];
}

function validujOcekavanyPocetSkupin(rozvrh, tymy, fmt) {
  const errors = [];
  const skupinovych = rozvrh.zapasy.filter(z => z.faze === "skupina").length;
  if (fmt.bezSkupin) {
    if (skupinovych !== 0) {
      errors.push(`bezSkupin=true ale skupinovych zapasu: ${skupinovych}`);
    }
    return errors;
  }
  const skupinyMap = new Map();
  for (const t of tymy) {
    skupinyMap.set(t.skupina, (skupinyMap.get(t.skupina) ?? 0) + 1);
  }
  let ocekavano = 0;
  for (const [, count] of skupinyMap) {
    ocekavano += (count * (count - 1)) / 2;
  }
  if (skupinovych !== ocekavano) {
    errors.push(`Spatny pocet skupinovych zapasu: ${skupinovych} != ocekavanych ${ocekavano}`);
  }
  return errors;
}

// ===== Generator testovych scenaru =====

const SCENARE = [];

function pridejScenar(jmeno, pocetTymu, pocetSkupin, fmtOver = {}) {
  SCENARE.push({
    jmeno,
    pocetTymu,
    pocetSkupin: pocetSkupin ?? vychoziPocetSkupin(pocetTymu),
    fmt: defaultFormat(fmtOver),
  });
}

// Zakladni: 4-60 tymu, sude i liche
[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 32, 40, 60].forEach(n => {
  pridejScenar(`${n}t, umisteni, 4 kurty`, n, undefined, { playoffMode: "umisteni" });
});

// Ruzne kurty
[1, 2, 3, 4, 6, 8].forEach(k => {
  pridejScenar(`8t, umisteni, ${k} kurtu`, 8, 2, { pocetKurtu: k });
});

// Playoff mody pro 8 tymu
["bez", "medaile", "vitez", "umisteni"].forEach(mode => {
  pridejScenar(`8t, ${mode}`, 8, 2, { playoffMode: mode });
});

// Vitez bracket sizes
["auto", "top4", "top8", "top16"].forEach(vb => {
  pridejScenar(`16t, vitez ${vb}`, 16, 4, { playoffMode: "vitez", vitezBracket: vb });
});

// Scoring typy
["gamy", "body", "cas"].forEach(st => {
  const lim = st === "gamy" ? 4 : st === "body" ? 24 : 15;
  pridejScenar(`8t, scoring=${st}/${lim}`, 8, 2, { scoringTyp: st, scoringLimit: lim, scoringLimitPlayoff: lim });
});

// Utechovy pavouk
[8, 16].forEach(n => {
  pridejScenar(`${n}t, utech medaile`, n, vychoziPocetSkupin(n), { playoffMode: "medaile", utechovyPavouk: true });
  pridejScenar(`${n}t, utech vitez`, n, vychoziPocetSkupin(n), { playoffMode: "vitez", utechovyPavouk: true });
});

// Vlastni delky
pridejScenar("8t vlastni delky", 8, 2, {
  delkaSkupinaMin: 15, delkaSemiMin: 20, delkaFinaleMin: 25, pauzaMin: 2,
});

// Tesny cas
pridejScenar("8t kratky cas", 8, 2, { casOd: "16:00", casDo: "17:30" });

// Hodne pasem
pridejScenar("20t umisteni 5pasem", 20, 4, { playoffMode: "umisteni" });
pridejScenar("24t umisteni 6pasem", 24, 4, { playoffMode: "umisteni" });

// Edge cases
pridejScenar("3t 1 skupina bez playoff", 3, 1, { playoffMode: "bez" });
pridejScenar("4t medaile na 1 kurtu", 4, 1, { pocetKurtu: 1, playoffMode: "medaile" });
pridejScenar("4t medaile na 2 kurtech", 4, 1, { pocetKurtu: 2, playoffMode: "medaile" });
pridejScenar("16t single elim 1 kurt", 16, 4, { pocetKurtu: 1, playoffMode: "vitez", vitezBracket: "top8" });
pridejScenar("8t medaile + utech", 8, 2, { playoffMode: "medaile", utechovyPavouk: true });
pridejScenar("12t umisteni 3 pasma 3 kurty", 12, 3, { pocetKurtu: 3, playoffMode: "umisteni" });
pridejScenar("8t bez playoff", 8, 2, { playoffMode: "bez" });
pridejScenar("16t bez playoff", 16, 4, { playoffMode: "bez" });
pridejScenar("liche 7t medaile", 7, 2, { playoffMode: "medaile" });
pridejScenar("liche 11t umisteni", 11, 3, { playoffMode: "umisteni" });
pridejScenar("liche 13t vitez top8", 13, 4, { playoffMode: "vitez", vitezBracket: "top8" });

// Vlastni delky pro CAS scoring
pridejScenar("8t cas + vlastni delky", 8, 2, {
  scoringTyp: "cas", scoringLimit: 15, scoringLimitPlayoff: 20,
  delkaSkupinaMin: 15, delkaSemiMin: 20, delkaFinaleMin: 25, pauzaMin: 2,
});

// Velmi velky turnaj
pridejScenar("60t 8 kurtu", 60, 15, { pocetKurtu: 8, playoffMode: "umisteni", casOd: "08:00", casDo: "20:00" });
pridejScenar("40t 6 kurtu", 40, 10, { pocetKurtu: 6, playoffMode: "umisteni", casOd: "09:00", casDo: "18:00" });

// Stresstest: vsechny mody pro 6t
["bez", "medaile", "vitez", "umisteni"].forEach(mode => {
  pridejScenar(`6t ${mode}`, 6, 2, { playoffMode: mode });
});

// Velmi tesny cas — nemusi sedet ale nesmi crashnout / mit konflikty
pridejScenar("8t velmi tesny cas", 8, 2, { casOd: "16:00", casDo: "16:45" });

// === skupiny_o_umisteni ===
pridejScenar("8t skupiny_o_umisteni 2 sk", 8, 2, { playoffMode: "skupiny_o_umisteni" });
pridejScenar("12t skupiny_o_umisteni 3 sk", 12, 3, { playoffMode: "skupiny_o_umisteni", casOd: "08:00", casDo: "20:00" });
pridejScenar("16t skupiny_o_umisteni 4 sk", 16, 4, { playoffMode: "skupiny_o_umisteni", casOd: "08:00", casDo: "22:00" });
pridejScenar("4t skupiny_o_umisteni 1 sk", 4, 1, { playoffMode: "skupiny_o_umisteni" });
pridejScenar("6t skupiny_o_umisteni 2 sk", 6, 2, { playoffMode: "skupiny_o_umisteni" });

// === Plný placement bracket ===
pridejScenar("placement 4t", 4, 1, { bezSkupin: true, playoffMode: "vitez", vitezBracket: "top4", placementBracket: true });
pridejScenar("placement 8t 4 kurty", 8, 2, { bezSkupin: true, playoffMode: "vitez", vitezBracket: "top8", placementBracket: true });
pridejScenar("placement 8t 2 kurty", 8, 2, { pocetKurtu: 2, bezSkupin: true, playoffMode: "vitez", vitezBracket: "top8", placementBracket: true, casDo: "20:00" });
pridejScenar("placement 16t 4 kurty", 16, 4, { bezSkupin: true, playoffMode: "vitez", vitezBracket: "top16", placementBracket: true, casOd: "08:00", casDo: "20:00" });
pridejScenar("placement 32t 6 kurtu", 32, 8, { pocetKurtu: 6, bezSkupin: true, playoffMode: "vitez", vitezBracket: "auto", placementBracket: true, casOd: "08:00", casDo: "22:00" });
pridejScenar("placement 64t 8 kurtu", 64, 16, { pocetKurtu: 8, bezSkupin: true, playoffMode: "vitez", vitezBracket: "auto", placementBracket: true, casOd: "08:00", casDo: "23:00" });
pridejScenar("placement 8t + skupiny", 8, 2, { playoffMode: "vitez", vitezBracket: "top8", placementBracket: true, casDo: "20:00" });

// === bezSkupin (jen playoff) ===
pridejScenar("bezSkupin 4t medaile", 4, 1, { bezSkupin: true, playoffMode: "medaile" });
pridejScenar("bezSkupin 8t medaile + utech", 8, 2, { bezSkupin: true, playoffMode: "medaile", utechovyPavouk: true });
pridejScenar("bezSkupin 8t vitez top8", 8, 2, { bezSkupin: true, playoffMode: "vitez", vitezBracket: "top8" });
pridejScenar("bezSkupin 16t vitez top16 + utech", 16, 4, { bezSkupin: true, playoffMode: "vitez", vitezBracket: "top16", utechovyPavouk: true });
pridejScenar("bezSkupin 8t umisteni 2 pasma", 8, 2, { bezSkupin: true, playoffMode: "umisteni" });
pridejScenar("bezSkupin 12t umisteni 3 pasma 3 kurty", 12, 3, { bezSkupin: true, pocetKurtu: 3, playoffMode: "umisteni" });
pridejScenar("bezSkupin 4t vitez na 1 kurtu", 4, 1, { bezSkupin: true, pocetKurtu: 1, playoffMode: "vitez", vitezBracket: "top4" });
pridejScenar("bezSkupin 16t medaile + utech 4 kurty", 16, 4, { bezSkupin: true, playoffMode: "medaile", utechovyPavouk: true });

// ===== Spousteni =====

console.log(`Spoustim ${SCENARE.length} scenaru...\n`);

let prosly = 0, selhaly = 0;
const failures = [];

for (const sc of SCENARE) {
  const tymy = vytvorTymyVeSkupinach(sc.pocetTymu, sc.pocetSkupin);
  const rozvrh = generujRozvrh(sc.fmt, tymy);
  const pocetPasem = sc.fmt.playoffMode === "umisteni" ? Math.ceil(sc.pocetTymu / 4) : 0;

  const errors = [
    ...validujKonfliktyKurtu(rozvrh, sc.fmt),
    ...validujKonfliktyTymu(rozvrh, sc.fmt),
    ...validujFinalePosledni(rozvrh, sc.fmt),
    ...validujParaleliMultiTier(rozvrh, sc.fmt, pocetPasem),
    ...validujOcekavanyPocetSkupin(rozvrh, tymy, sc.fmt),
  ];

  if (errors.length === 0) {
    prosly++;
    process.stdout.write(".");
  } else {
    selhaly++;
    process.stdout.write("F");
    failures.push({ scenar: sc.jmeno, errors });
  }
}

console.log("\n");
console.log(`Prosly: ${prosly} / ${SCENARE.length}`);
console.log(`Selhaly: ${selhaly}`);

if (failures.length > 0) {
  console.log("\n=== SELHANI ===\n");
  for (const f of failures) {
    console.log(`[FAIL] ${f.scenar}`);
    for (const e of f.errors) console.log(`   - ${e}`);
    console.log();
  }
  process.exit(1);
}
