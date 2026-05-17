import { generujRozvrh } from "../src/lib/turnaj-format.ts";

const N = Number(process.argv[2] ?? 12);
const K = Number(process.argv[3] ?? 3);
const tymy = [];
const skupiny = "ABCDEFGH";
for (let i = 0; i < N; i++) {
  tymy.push({
    tymId: `t${i + 1}`,
    nazev: String(i + 1),
    skupina: skupiny[i % K],
    nasazeni: Math.floor(i / K) + 1,
  });
}

const fmt = {
  scoringTyp: "gamy",
  scoringLimit: 4,
  scoringLimitPlayoff: 4,
  playoffMode: process.argv[4] ?? "skupiny_o_umisteni",
  vitezBracket: "auto",
  utechovyPavouk: false,
  bezSkupin: false,
  pointRule: "golden",
  pocetKurtu: 4,
  casOd: "16:00",
  casDo: "22:00",
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
