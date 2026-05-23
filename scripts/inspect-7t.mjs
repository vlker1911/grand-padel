import { generujRozvrh } from "../src/lib/turnaj-format.ts";

function vytvor() {
  const tymy = [];
  for (let i = 0; i < 7; i++) {
    tymy.push({ tymId: `t${i + 1}`, nazev: String(i + 1), skupina: "AB"[i % 2], nasazeni: Math.floor(i / 2) + 1 });
  }
  return tymy;
}

const baseFmt = {
  scoringTyp: "gamy", scoringLimit: 4, scoringLimitPlayoff: 4,
  vitezBracket: "auto",
  utechovyPavouk: false, bezSkupin: false, placementBracket: false,
  postupovyKlic: undefined, pointRule: "star",
  pocetKurtu: 4, casOd: "08:00", casDo: "22:00",
  delkaSkupinaMin: null, delkaSemiMin: null, delkaFinaleMin: null,
  pauzaMin: 1,
};

const scenare = [
  { popis: "A) medaile (Final Four)", over: { playoffMode: "medaile" } },
  { popis: "B) vitez top4", over: { playoffMode: "vitez", vitezBracket: "top4" } },
  { popis: "C) vitez top8 (zaokrouhleno dolu)", over: { playoffMode: "vitez", vitezBracket: "top8" } },
  { popis: "D) vitez auto + placement (každý hraje)", over: { playoffMode: "vitez", vitezBracket: "auto", placementBracket: true } },
  { popis: "E) umisteni (multi-tier)", over: { playoffMode: "umisteni" } },
  { popis: "F) skupiny_o_umisteni", over: { playoffMode: "skupiny_o_umisteni" } },
  { popis: "G) klíč top1 (jen vítězové)", over: { playoffMode: "vitez", postupovyKlic: { hlavniPocetZeSkupiny: 1 } } },
  { popis: "H) klíč top1 + 2-3 útěch", over: { playoffMode: "vitez", postupovyKlic: { hlavniPocetZeSkupiny: 1, utechovy: { od: 2, do: 3 } } } },
  { popis: "I) klíč top2 + 3-4 útěch", over: { playoffMode: "vitez", postupovyKlic: { hlavniPocetZeSkupiny: 2, utechovy: { od: 3, do: 4 } } } },
];

for (const sc of scenare) {
  console.log(`\n========== ${sc.popis} ==========`);
  const fmt = { ...baseFmt, ...sc.over };
  const r = generujRozvrh(fmt, vytvor());
  const sk = r.zapasy.filter(z => z.faze === "skupina").length;
  const pl = r.zapasy.length - sk;
  console.log(`Zápasů: ${r.zapasy.length} (${sk} sk + ${pl} pl), ${r.trvaniMin} min`);
  // Hraje který tým?
  const tymyHrajiciPlayoff = new Set();
  for (const z of r.zapasy) {
    if (z.faze === "skupina") continue;
    const l1 = (z.tym1Label ?? "").match(/^(\d+)\.([A-Z])/);
    const l2 = (z.tym2Label ?? "").match(/^(\d+)\.([A-Z])/);
    if (l1) tymyHrajiciPlayoff.add(`${l1[1]}.${l1[2]}`);
    if (l2) tymyHrajiciPlayoff.add(`${l2[1]}.${l2[2]}`);
  }
  // Všechny pozice ze skupin (A má 4, B má 3)
  const vsechnyPozice = ["1.A", "2.A", "3.A", "4.A", "1.B", "2.B", "3.B"];
  const nehraji = vsechnyPozice.filter(p => !tymyHrajiciPlayoff.has(p));
  if (pl > 0) {
    console.log(`Pozice hrající playoff: ${[...tymyHrajiciPlayoff].sort().join(", ")}`);
    if (nehraji.length > 0) console.log(`Pozice NEHRAJÍ playoff: ${nehraji.join(", ")}`);
    else console.log(`Všechny pozice hrají playoff ✓`);
  }
  // Vypis playoff zápasy
  for (const z of r.zapasy.filter(z => z.faze !== "skupina").sort((a, b) => a.casZacatek.localeCompare(b.casZacatek))) {
    console.log(`  ${z.casZacatek}-${z.casKonec} | ${z.umisteni?.padEnd(30)} | ${z.tym1Label} vs ${z.tym2Label}`);
  }
}
