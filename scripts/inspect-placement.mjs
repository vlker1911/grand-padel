import { generujRozvrh } from "../src/lib/turnaj-format.ts";

const N = Number(process.argv[2] ?? 8);
const tymy = [];
for (let i = 0; i < N; i++) {
  tymy.push({ tymId: `t${i + 1}`, nazev: String(i + 1), skupina: "A", nasazeni: i + 1 });
}

const fmt = {
  scoringTyp: "gamy",
  scoringLimit: 4,
  scoringLimitPlayoff: 4,
  playoffMode: "vitez",
  vitezBracket: "auto",
  utechovyPavouk: false,
  bezSkupin: true,
  placementBracket: true,
  pointRule: "golden",
  pocetKurtu: 4,
  casOd: "08:00",
  casDo: "20:00",
  delkaSkupinaMin: null,
  delkaSemiMin: null,
  delkaFinaleMin: null,
  pauzaMin: 1,
};

const r = generujRozvrh(fmt, tymy);
console.log(`${N} tymu, placement bracket: ${r.zapasy.length} zapasu, trvani ${r.trvaniMin} min, ${r.vejdeSe ? "OK" : "PRESAH " + Math.abs(r.rezervaMin)}`);
console.log();
console.log("Cas     | Kurt | Faze       | Umisteni                | Zapas");
console.log("--------|------|------------|-------------------------|-------");
for (const z of r.zapasy.sort((a, b) => a.casZacatek.localeCompare(b.casZacatek))) {
  console.log(`${z.casZacatek}-${z.casKonec} | K${z.kurt}   | ${z.faze.padEnd(10)} | ${(z.umisteni ?? "").padEnd(23)} | ${z.tym1Label} vs ${z.tym2Label}${z.jeFinaleCela ? " [FINAL]" : ""}`);
}
