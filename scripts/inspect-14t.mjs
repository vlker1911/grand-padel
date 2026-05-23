import { generujRozvrh } from "../src/lib/turnaj-format.ts";

// 14 týmů ve 4 skupinách (A=4, B=4, C=3, D=3). Klíč top 2 + utech 3-4.
// Ovšem C a D nemají 4. místo — engine by neměl generovat zápasy s placeholdery
// které nikdy nedostanou tým.
const tymy = [];
const skupinyNum = [4, 4, 3, 3]; // velikosti A, B, C, D
let id = 1;
for (let i = 0; i < skupinyNum.length; i++) {
  for (let j = 0; j < skupinyNum[i]; j++) {
    tymy.push({ tymId: `t${id}`, nazev: String(id), skupina: "ABCD"[i], nasazeni: j + 1 });
    id++;
  }
}

const fmt = {
  scoringTyp: "gamy", scoringLimit: 4, scoringLimitPlayoff: 4,
  playoffMode: "vitez", vitezBracket: "auto",
  utechovyPavouk: false, bezSkupin: false, placementBracket: false,
  postupovyKlic: { hlavniPocetZeSkupiny: 2, utechovy: { od: 3, do: 4 } },
  pointRule: "star",
  pocetKurtu: 4, casOd: "08:00", casDo: "22:00",
  delkaSkupinaMin: null, delkaSemiMin: null, delkaFinaleMin: null,
  pauzaMin: 1,
};

const r = generujRozvrh(fmt, tymy);
console.log(`14t (A=4, B=4, C=3, D=3) / klíč top2 + utech 3-4: ${r.zapasy.length} zápasů`);
console.log();
console.log("Playoff zápasy:");
for (const z of r.zapasy.filter(z => z.faze !== "skupina").sort((a, b) => a.casZacatek.localeCompare(b.casZacatek))) {
  // Označ zápasy s "neexistujícím" labelem (např. 4.C nebo 4.D)
  const podezrele = /^[34]\.[CD]/i.test(z.tym1Label) || /^[34]\.[CD]/i.test(z.tym2Label);
  console.log(`  ${z.casZacatek}-${z.casKonec} K${z.kurt} | ${z.umisteni?.padEnd(38)} | ${z.tym1Label} vs ${z.tym2Label}${podezrele ? " ⚠ podezřelý placeholder" : ""}`);
}
