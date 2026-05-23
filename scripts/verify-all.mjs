// Systematická matice všech smysluplných kombinací turnajového formátu.
// Pro každou: spustí engine, ověří validátory, vypíše report.
//
// Spuštění: node --experimental-strip-types --no-warnings scripts/verify-all.mjs

import { generujRozvrh } from "../src/lib/turnaj-format.ts";

function parseHM(s) { const [h, m] = s.split(":").map(Number); return h * 60 + (m || 0); }

function vytvorTymy(pocet, pocetSkupin) {
  const skupiny = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const tymy = [];
  for (let i = 0; i < pocet; i++) {
    tymy.push({
      tymId: `t${i + 1}`,
      nazev: String(i + 1),
      skupina: skupiny[i % pocetSkupin],
      nasazeni: Math.floor(i / pocetSkupin) + 1,
    });
  }
  return tymy;
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
    pointRule: "star",
    pocetKurtu: 4,
    casOd: "08:00",
    casDo: "22:00",
    delkaSkupinaMin: null,
    delkaSemiMin: null,
    delkaFinaleMin: null,
    pauzaMin: 1,
    ...over,
  };
}

// ===== Validatory =====

function validujKurty(rozvrh) {
  const perKurt = new Map();
  for (const z of rozvrh.zapasy) {
    const arr = perKurt.get(z.kurt) ?? [];
    arr.push(z);
    perKurt.set(z.kurt, arr);
  }
  for (const [kurt, list] of perKurt.entries()) {
    list.sort((a, b) => parseHM(a.casZacatek) - parseHM(b.casZacatek));
    for (let i = 0; i < list.length - 1; i++) {
      if (parseHM(list[i].casKonec) > parseHM(list[i + 1].casZacatek)) {
        return `Kurt K${kurt}: prekryv ${list[i].casZacatek}-${list[i].casKonec} a ${list[i + 1].casZacatek}-${list[i + 1].casKonec}`;
      }
    }
  }
  return null;
}

function validujTymy(rozvrh, pauzaMin) {
  const perTym = new Map();
  for (const z of rozvrh.zapasy) {
    for (const tid of [z.tym1Id, z.tym2Id]) {
      if (!tid) continue;
      (perTym.get(tid) ?? perTym.set(tid, []).get(tid)).push(z);
    }
  }
  for (const [tid, list] of perTym.entries()) {
    list.sort((a, b) => parseHM(a.casZacatek) - parseHM(b.casZacatek));
    for (let i = 0; i < list.length - 1; i++) {
      const konec = parseHM(list[i].casKonec);
      const start = parseHM(list[i + 1].casZacatek);
      if (konec > start) return `Tym ${tid}: prekryv`;
      if (start - konec < pauzaMin) return `Tym ${tid}: nedostatecna pauza`;
    }
  }
  return null;
}

function validujPocetSkupin(rozvrh, tymy, fmt) {
  const sk = rozvrh.zapasy.filter(z => z.faze === "skupina").length;
  if (fmt.bezSkupin) {
    if (sk !== 0) return `bezSkupin=true ale ${sk} skupinovych zapasu`;
    return null;
  }
  const skupinyMap = new Map();
  for (const t of tymy) skupinyMap.set(t.skupina, (skupinyMap.get(t.skupina) ?? 0) + 1);
  let ocek = 0;
  for (const c of skupinyMap.values()) ocek += (c * (c - 1)) / 2;
  if (sk !== ocek) return `Skupiny: ${sk} != ${ocek}`;
  return null;
}

function validujFinaleExistuje(rozvrh, fmt) {
  if (fmt.playoffMode === "bez") return null;
  if (fmt.playoffMode === "skupiny_o_umisteni") return null;
  const fin = rozvrh.zapasy.find(z => z.jeFinaleCela);
  if (!fin) return `Chybi finale cela (mode=${fmt.playoffMode})`;
  return null;
}

// Pro placement: kazdy z bs tymu hraje log2(bs) zapasu (= pocet kol)
function validujPlacementPocty(rozvrh, fmt, tymuCelkem) {
  if (!fmt.placementBracket || fmt.playoffMode !== "vitez") return null;
  let bs;
  if (fmt.vitezBracket === "top4") bs = 4;
  else if (fmt.vitezBracket === "top8") bs = 8;
  else if (fmt.vitezBracket === "top16") bs = 16;
  else { bs = 2; while (bs * 2 <= tymuCelkem && bs < 128) bs *= 2; }
  while (bs > tymuCelkem && bs > 2) bs /= 2;
  const ocekZapasu = (bs * Math.log2(bs)) / 2; // N*log2(N)/2
  const realZapasu = rozvrh.zapasy.filter(z => z.faze === "placement" || z.faze === "finale").length;
  // Skupinove zapasy jsou navic
  const skupiny = rozvrh.zapasy.filter(z => z.faze === "skupina").length;
  const playoff = rozvrh.zapasy.length - skupiny;
  if (playoff !== ocekZapasu) return `Placement: ${playoff} playoff zapasu != ocekavanych ${ocekZapasu}`;
  return null;
}

// ===== Scenare =====

const SCENARE = [];
function S(jmeno, pocetTymu, pocetSkupin, fmtOver = {}) {
  SCENARE.push({ jmeno, pocetTymu, pocetSkupin, fmt: defaultFormat(fmtOver) });
}

// Matrix: pro kazdy mode + flagy zkusit 4, 8, 16 tymu (kde to ma smysl)
const VELIKOSTI = [
  { n: 4,  k: 1 },
  { n: 8,  k: 2 },
  { n: 16, k: 4 },
];

// ===== A) Skupiny + ruzne playoff =====
for (const { n, k } of VELIKOSTI) {
  S(`A1 ${n}t skupiny+bez_playoff`, n, k, { playoffMode: "bez" });
  S(`A2 ${n}t skupiny+medaile`, n, k, { playoffMode: "medaile" });
  S(`A3 ${n}t skupiny+medaile+utech`, n, k, { playoffMode: "medaile", utechovyPavouk: true });
  S(`A4 ${n}t skupiny+vitez_top4`, n, k, { playoffMode: "vitez", vitezBracket: "top4" });
  S(`A5 ${n}t skupiny+umisteni`, n, k, { playoffMode: "umisteni" });
  S(`A6 ${n}t skupiny+skupiny_o_umisteni`, n, k, { playoffMode: "skupiny_o_umisteni" });
}
// Placement jen kde dava smysl (n=8 vyse, top8/16)
S("A7 8t skupiny+vitez_top8+placement", 8, 2, { playoffMode: "vitez", vitezBracket: "top8", placementBracket: true });
S("A8 16t skupiny+vitez_top16+placement", 16, 4, { playoffMode: "vitez", vitezBracket: "top16", placementBracket: true, casOd: "08:00", casDo: "22:00" });

// ===== B) Bez skupin + ruzne playoff =====
for (const { n, k } of VELIKOSTI) {
  S(`B1 ${n}t bez_skupin+medaile`, n, k, { bezSkupin: true, playoffMode: "medaile" });
  S(`B2 ${n}t bez_skupin+medaile+utech`, n, k, { bezSkupin: true, playoffMode: "medaile", utechovyPavouk: true });
  S(`B3 ${n}t bez_skupin+vitez_top${n === 4 ? "4" : n === 8 ? "8" : "16"}`, n, k, {
    bezSkupin: true, playoffMode: "vitez", vitezBracket: n === 4 ? "top4" : n === 8 ? "top8" : "top16",
  });
  S(`B4 ${n}t bez_skupin+umisteni`, n, k, { bezSkupin: true, playoffMode: "umisteni" });
}
S("B5 8t bez_skupin+vitez_top8+placement", 8, 2, { bezSkupin: true, playoffMode: "vitez", vitezBracket: "top8", placementBracket: true });
S("B6 16t bez_skupin+vitez_top16+placement", 16, 4, { bezSkupin: true, playoffMode: "vitez", vitezBracket: "top16", placementBracket: true });
S("B7 32t bez_skupin+placement 6 kurtu", 32, 8, { pocetKurtu: 6, bezSkupin: true, playoffMode: "vitez", vitezBracket: "auto", placementBracket: true });
S("B8 64t bez_skupin+placement 8 kurtu", 64, 16, { pocetKurtu: 8, bezSkupin: true, playoffMode: "vitez", vitezBracket: "auto", placementBracket: true });

// ===== C) Liche pocty =====
[5, 7, 9, 11, 13, 15].forEach(n => {
  S(`C ${n}t (liche) skupiny+umisteni`, n, Math.max(1, Math.ceil(n / 4)), { playoffMode: "umisteni" });
});

// ===== D) Edge cases =====
S("D1 4t 1 kurt medaile", 4, 1, { pocetKurtu: 1, playoffMode: "medaile" });
S("D2 8t 1 kurt placement", 8, 2, { pocetKurtu: 1, bezSkupin: true, playoffMode: "vitez", vitezBracket: "top8", placementBracket: true });
S("D3 8t tesny cas (2h)", 8, 2, { casOd: "16:00", casDo: "18:00", playoffMode: "umisteni" });
S("D4 16t pomale (cas)", 16, 4, { scoringTyp: "cas", scoringLimit: 15, scoringLimitPlayoff: 15, casOd: "08:00", casDo: "22:00", playoffMode: "umisteni" });
S("D5 3t 1 skupina bez playoff", 3, 1, { playoffMode: "bez" });

// ===== E) Velke turnaje placement =====
S("E1 32t skupiny+placement", 32, 8, { pocetKurtu: 8, playoffMode: "vitez", vitezBracket: "auto", placementBracket: true, casDo: "23:00" });

// ===== F) Postupovy klic =====
S("F1 16t/4sk top2 hlavni + 3-4 utech", 16, 4, {
  playoffMode: "vitez",
  postupovyKlic: { hlavniPocetZeSkupiny: 2, utechovy: { od: 3, do: 4 } },
});
S("F2 16t/4sk top1 hlavni (jen vitezove)", 16, 4, {
  playoffMode: "vitez",
  postupovyKlic: { hlavniPocetZeSkupiny: 1 },
});
S("F3 32t/8sk top2 hlavni + 3-4 utech", 32, 8, {
  pocetKurtu: 8, playoffMode: "vitez",
  postupovyKlic: { hlavniPocetZeSkupiny: 2, utechovy: { od: 3, do: 4 } },
  casDo: "23:00",
});

// ===== Spousteni =====

console.log(`\n===== Verifikace ${SCENARE.length} scenaru =====\n`);

const failures = [];
let pass = 0;
for (const sc of SCENARE) {
  const tymy = vytvorTymy(sc.pocetTymu, sc.pocetSkupin);
  const rozvrh = generujRozvrh(sc.fmt, tymy);

  const errors = [
    validujKurty(rozvrh),
    validujTymy(rozvrh, sc.fmt.pauzaMin),
    validujPocetSkupin(rozvrh, tymy, sc.fmt),
    validujFinaleExistuje(rozvrh, sc.fmt),
    validujPlacementPocty(rozvrh, sc.fmt, sc.pocetTymu),
  ].filter(e => e !== null);

  // Souhrn
  const trvani = `${rozvrh.trvaniMin} min`;
  const vejde = rozvrh.vejdeSe ? "OK" : `presah ${Math.abs(rozvrh.rezervaMin)} min`;
  const pocet = rozvrh.zapasy.length;
  const sk = rozvrh.zapasy.filter(z => z.faze === "skupina").length;
  const pl = pocet - sk;
  const skupL = sk > 0 ? `${sk}sk` : "";
  const plL = pl > 0 ? `${pl}pl` : "";
  const stav = errors.length === 0 ? "[OK]" : "[FAIL]";
  const radek = `${stav} ${sc.jmeno.padEnd(50)} | ${String(pocet).padStart(3)}z (${skupL}${skupL && plL ? "+" : ""}${plL}) ${trvani.padStart(8)} ${vejde}`;
  console.log(radek);

  if (errors.length === 0) pass++;
  else failures.push({ jmeno: sc.jmeno, errors });
}

console.log(`\nVysledek: ${pass}/${SCENARE.length} OK`);
if (failures.length > 0) {
  console.log("\n=== SELHANI ===\n");
  for (const f of failures) {
    console.log(`[FAIL] ${f.jmeno}`);
    for (const e of f.errors) console.log(`   - ${e}`);
  }
  process.exit(1);
}
