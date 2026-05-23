import { generujRozvrh } from "../src/lib/turnaj-format.ts";

function vytvor(N, K) {
  const tymy = [];
  const sk = "ABCDEFGH".split("");
  for (let i = 0; i < N; i++) {
    tymy.push({ tymId: `t${i + 1}`, nazev: String(i + 1), skupina: sk[i % K], nasazeni: Math.floor(i / K) + 1 });
  }
  return tymy;
}

const baseFmt = {
  scoringTyp: "gamy", scoringLimit: 4, scoringLimitPlayoff: 4,
  vitezBracket: "auto", utechovyPavouk: false, bezSkupin: false,
  placementBracket: false, postupovyKlic: undefined, pointRule: "star",
  pocetKurtu: 4, casOd: "08:00", casDo: "22:00",
  delkaSkupinaMin: null, delkaSemiMin: null, delkaFinaleMin: null,
  pauzaMin: 1, playoffMode: "umisteni",
};

for (const N of [7, 11, 15, 19, 23]) {
  const K = Math.max(2, Math.ceil(N / 4));
  const r = generujRozvrh(baseFmt, vytvor(N, K));
  const sk = r.zapasy.filter(z => z.faze === "skupina").length;
  const pl = r.zapasy.length - sk;
  console.log(`\n=== ${N}t / ${K}sk / umisteni: ${r.zapasy.length} zápasů (${sk}sk + ${pl}pl), ${r.trvaniMin} min ===`);
  for (const z of r.zapasy.filter(z => z.faze !== "skupina").sort((a, b) => a.casZacatek.localeCompare(b.casZacatek))) {
    console.log(`  ${z.casZacatek}-${z.casKonec} K${z.kurt} | ${z.umisteni?.padEnd(40)} | ${z.tym1Label} vs ${z.tym2Label}`);
  }
}
