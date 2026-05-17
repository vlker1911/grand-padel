import { generujRozvrh } from "../src/lib/turnaj-format.ts";

const tymy = [];
const skupiny = "AB";
for (let i = 0; i < 8; i++) {
  tymy.push({
    tymId: `t${i + 1}`,
    nazev: String(i + 1),
    skupina: skupiny[i % 2],
    nasazeni: Math.floor(i / 2) + 1,
  });
}

const fmt = {
  scoringTyp: "gamy",
  scoringLimit: 4,
  scoringLimitPlayoff: 4,
  playoffMode: "umisteni",
  vitezBracket: "auto",
  utechovyPavouk: false,
  pocetKurtu: 4,
  casOd: "16:00",
  casDo: "18:00",
  delkaSkupinaMin: null,
  delkaSemiMin: null,
  delkaFinaleMin: null,
  pauzaMin: 1,
};

const r = generujRozvrh(fmt, tymy);
console.log(`Zapasu: ${r.zapasy.length}, trvani ${r.trvaniMin} min, ${r.vejdeSe ? "OK" : "PRESAH " + Math.abs(r.rezervaMin)}`);
console.log();
console.log("Cas     | Kurt | Faze           | Zapas");
console.log("--------|------|----------------|-------");
for (const z of r.zapasy.sort((a, b) => a.casZacatek.localeCompare(b.casZacatek))) {
  console.log(`${z.casZacatek}-${z.casKonec} | K${z.kurt}   | ${(z.umisteni ?? z.faze).padEnd(14)} | ${z.tym1Label} vs ${z.tym2Label}${z.jeFinaleCela ? " [FINALE CELA]" : ""}`);
}
