// Test postupového klíče: top 2 -> hlavní, 3-4 -> útěchový.
import { generujRozvrh } from "../src/lib/turnaj-format.ts";

const N = 16, K = 4;
const tymy = [];
for (let i = 0; i < N; i++) {
  tymy.push({ tymId: `t${i + 1}`, nazev: String(i + 1), skupina: "ABCD"[i % K], nasazeni: Math.floor(i / K) + 1 });
}

const fmt = {
  scoringTyp: "gamy",
  scoringLimit: 4,
  scoringLimitPlayoff: 4,
  playoffMode: "vitez",
  vitezBracket: "auto",
  utechovyPavouk: false,
  bezSkupin: false,
  placementBracket: false,
  postupovyKlic: { hlavniPocetZeSkupiny: 2, utechovy: { od: 3, do: 4 } },
  pointRule: "star",
  pocetKurtu: 4,
  casOd: "16:00",
  casDo: "22:00",
  delkaSkupinaMin: null, delkaSemiMin: null, delkaFinaleMin: null,
  pauzaMin: 1,
};

const r = generujRozvrh(fmt, tymy);
console.log(`${N}t / 4sk / klíč {hlavní: top 2, útěch: 3-4}: ${r.zapasy.length} zápasů, trvání ${r.trvaniMin} min, ${r.vejdeSe ? "OK" : "PRESAH"}`);
console.log();
console.log("Cas     | Kurt | Faze        | Umisteni                            | Zapas");
console.log("--------|------|-------------|-------------------------------------|-------");
for (const z of r.zapasy.sort((a, b) => a.casZacatek.localeCompare(b.casZacatek))) {
  console.log(`${z.casZacatek}-${z.casKonec} | K${z.kurt}   | ${z.faze.padEnd(11)} | ${(z.umisteni ?? "").padEnd(35)} | ${z.tym1Label} vs ${z.tym2Label}${z.jeFinaleCela ? " [FINAL]" : ""}`);
}
