import { generujRozvrh } from "../src/lib/turnaj-format.ts";

function vytvor(N, K) {
  const sk = "ABCDEFGH".split("");
  const tymy = [];
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

for (const N of [5, 9, 13]) {
  const K = Math.max(2, Math.ceil(N / 4));
  for (const volba of ["automaticky", "slouceni_pasem", "bonus_zapas"]) {
    const r = generujRozvrh({ ...baseFmt, posledniSamotny: volba }, vytvor(N, K));
    const sk = r.zapasy.filter(z => z.faze === "skupina").length;
    const pl = r.zapasy.length - sk;
    console.log(`\n=== ${N}t / ${K}sk / N mod 4 = ${N % 4} / volba: ${volba} ===`);
    console.log(`${r.zapasy.length} zápasů (${sk}sk + ${pl}pl), ${r.trvaniMin} min`);
    for (const z of r.zapasy.filter(z => z.faze !== "skupina").sort((a, b) => a.casZacatek.localeCompare(b.casZacatek))) {
      console.log(`  ${z.casZacatek}-${z.casKonec} K${z.kurt} | ${z.umisteni?.padEnd(40)} | ${z.tym1Label} vs ${z.tym2Label}`);
    }
  }
}
