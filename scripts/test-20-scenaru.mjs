// 20 specifických scénářů s důrazem na edge cases (liché počty, nedělitelné,
// nasazení, postupový klíč, různé počty kurtů).
//
// Spuštění: node --experimental-strip-types --no-warnings scripts/test-20-scenaru.mjs

import { generujRozvrh } from "../src/lib/turnaj-format.ts";

function parseHM(s) { const [h, m] = s.split(":").map(Number); return h * 60 + (m || 0); }

function vytvorTymy(N, K, nasazeniArr = []) {
  const skupinyChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const tymy = [];
  for (let i = 0; i < N; i++) {
    tymy.push({
      tymId: `t${i + 1}`,
      nazev: String(i + 1),
      skupina: skupinyChars[i % K],
      nasazeni: nasazeniArr.includes(i + 1) ? nasazeniArr.indexOf(i + 1) + 1 : (Math.floor(i / K) + 1),
    });
  }
  return tymy;
}

function defaultFmt(over = {}) {
  return {
    scoringTyp: "gamy", scoringLimit: 4, scoringLimitPlayoff: 4,
    playoffMode: "umisteni", vitezBracket: "auto",
    utechovyPavouk: false, bezSkupin: false, placementBracket: false,
    postupovyKlic: undefined, pointRule: "star",
    pocetKurtu: 4, casOd: "08:00", casDo: "22:00",
    delkaSkupinaMin: null, delkaSemiMin: null, delkaFinaleMin: null,
    pauzaMin: 1,
    ...over,
  };
}

function val(rozvrh, fmt, ocekavanyPocet) {
  const errs = [];
  // Konflikt kurtů
  const perKurt = new Map();
  for (const z of rozvrh.zapasy) {
    const arr = perKurt.get(z.kurt) ?? [];
    arr.push(z); perKurt.set(z.kurt, arr);
  }
  for (const [kurt, list] of perKurt.entries()) {
    list.sort((a, b) => parseHM(a.casZacatek) - parseHM(b.casZacatek));
    for (let i = 0; i < list.length - 1; i++) {
      if (parseHM(list[i].casKonec) > parseHM(list[i + 1].casZacatek)) {
        errs.push(`Konflikt kurt K${kurt}`); break;
      }
    }
  }
  // Konflikt týmů (jen pro zápasy s reálnými ID)
  const perTym = new Map();
  for (const z of rozvrh.zapasy) {
    for (const tid of [z.tym1Id, z.tym2Id]) {
      if (!tid) continue;
      const arr = perTym.get(tid) ?? [];
      arr.push(z); perTym.set(tid, arr);
    }
  }
  for (const [tid, list] of perTym.entries()) {
    list.sort((a, b) => parseHM(a.casZacatek) - parseHM(b.casZacatek));
    for (let i = 0; i < list.length - 1; i++) {
      const konec = parseHM(list[i].casKonec);
      const start = parseHM(list[i + 1].casZacatek);
      if (konec > start) { errs.push(`Konflikt tym ${tid}`); break; }
      if (start - konec < fmt.pauzaMin) { errs.push(`Pauza tym ${tid}`); break; }
    }
  }
  // Validace dat: žádný NaN, undefined v casech / kurtech
  for (const z of rozvrh.zapasy) {
    if (!z.casZacatek || !z.casKonec || !z.kurt) {
      errs.push(`Chybi cas/kurt v ${z.umisteni ?? z.faze}`); break;
    }
  }
  // Ocekavany pocet (pokud zadan)
  if (ocekavanyPocet != null && rozvrh.zapasy.length !== ocekavanyPocet) {
    errs.push(`Pocet zapasu: ${rozvrh.zapasy.length} != ocekavano ${ocekavanyPocet}`);
  }
  return errs;
}

const scenare = [
  // 1-5: lichí počty týmů s různými moduy
  { jmeno: "1) 3t/1sk bez playoff (mini)", N: 3, K: 1, over: { playoffMode: "bez" }, ocek: 3 },
  { jmeno: "2) 5t (lichý)/2sk multi-tier", N: 5, K: 2, over: { playoffMode: "umisteni" } },
  { jmeno: "3) 7t (lichý)/2sk vitez top4", N: 7, K: 2, over: { playoffMode: "vitez", vitezBracket: "top4" } },
  { jmeno: "4) 9t (lichý)/3sk placement", N: 9, K: 3, over: { playoffMode: "vitez", vitezBracket: "auto", placementBracket: true } },
  { jmeno: "5) 11t (lichý)/3sk klíč top1+2-3util", N: 11, K: 3, over: { playoffMode: "vitez", postupovyKlic: { hlavniPocetZeSkupiny: 1, utechovy: { od: 2, do: 3 } } } },

  // 6-10: nedělitelné počty
  { jmeno: "6) 13t/4sk skupiny_o_umisteni", N: 13, K: 4, over: { playoffMode: "skupiny_o_umisteni" } },
  { jmeno: "7) 14t/4sk klíč top2+3-4util", N: 14, K: 4, over: { playoffMode: "vitez", postupovyKlic: { hlavniPocetZeSkupiny: 2, utechovy: { od: 3, do: 4 } } } },
  { jmeno: "8) 15t/4sk vitez top8 + placement", N: 15, K: 4, over: { playoffMode: "vitez", vitezBracket: "top8", placementBracket: true } },
  { jmeno: "9) 20t/5sk multi-tier", N: 20, K: 5, over: { playoffMode: "umisteni" } },
  { jmeno: "10) 24t/6sk klíč top2+3-4util", N: 24, K: 6, over: { pocetKurtu: 6, playoffMode: "vitez", postupovyKlic: { hlavniPocetZeSkupiny: 2, utechovy: { od: 3, do: 4 } } } },

  // 11-15: extrémní velikosti a edge cases
  { jmeno: "11) 27t (lichý)/7sk bez playoff", N: 27, K: 7, over: { playoffMode: "bez" } },
  { jmeno: "12) 30t/6sk placement", N: 30, K: 6, over: { pocetKurtu: 6, playoffMode: "vitez", placementBracket: true, casDo: "23:00" } },
  { jmeno: "13) 4t bez skupin placement", N: 4, K: 1, over: { bezSkupin: true, playoffMode: "vitez", vitezBracket: "top4", placementBracket: true } },
  { jmeno: "14) 6t/2sk vitez top4 + utech", N: 6, K: 2, over: { playoffMode: "vitez", vitezBracket: "top4", utechovyPavouk: true } },
  { jmeno: "15) 8t/2sk nasazení 1-8 + vitez", N: 8, K: 2, over: { playoffMode: "vitez", vitezBracket: "top4" }, nas: [1, 2, 3, 4, 5, 6, 7, 8] },

  // 16-20: kombinace klíče, časový formát, velikosti
  { jmeno: "16) 16t/4sk nas 1-16 + klíč top2+3-4", N: 16, K: 4, over: { playoffMode: "vitez", postupovyKlic: { hlavniPocetZeSkupiny: 2, utechovy: { od: 3, do: 4 } } }, nas: Array.from({ length: 16 }, (_, i) => i + 1) },
  { jmeno: "17) 32t/8sk placement (6 kurtu, dlouhy)", N: 32, K: 8, over: { pocetKurtu: 6, playoffMode: "vitez", placementBracket: true, casOd: "08:00", casDo: "23:00" } },
  { jmeno: "18) 4t / 1 kurt vitez (sériově)", N: 4, K: 1, over: { pocetKurtu: 1, playoffMode: "vitez", vitezBracket: "top4" } },
  { jmeno: "19) 8t / čas 15 min / 4 kurty", N: 8, K: 2, over: { scoringTyp: "cas", scoringLimit: 15, scoringLimitPlayoff: 15, casOd: "18:00", casDo: "21:00", playoffMode: "umisteni" } },
  { jmeno: "20) 12t/3sk klíč top2+3-4 + Star Point", N: 12, K: 3, over: { playoffMode: "vitez", postupovyKlic: { hlavniPocetZeSkupiny: 2, utechovy: { od: 3, do: 4 } }, pointRule: "star" } },
];

console.log(`\n===== TEST 20 SCÉNÁŘŮ =====\n`);
let pass = 0;
const fails = [];
for (const sc of scenare) {
  const tymy = vytvorTymy(sc.N, sc.K, sc.nas ?? []);
  const fmt = defaultFmt(sc.over);
  const rozvrh = generujRozvrh(fmt, tymy);
  const errs = val(rozvrh, fmt, sc.ocek);

  const skupiny = rozvrh.zapasy.filter(z => z.faze === "skupina").length;
  const playoff = rozvrh.zapasy.length - skupiny;
  const trvani = `${rozvrh.trvaniMin} min`;
  const vejde = rozvrh.vejdeSe ? "vejde se" : `PRESAH ${Math.abs(rozvrh.rezervaMin)} min`;
  const skupL = skupiny > 0 ? `${skupiny}sk` : "";
  const plL = playoff > 0 ? `${playoff}pl` : "";
  const stav = errs.length === 0 ? "[OK]" : "[FAIL]";
  console.log(`${stav} ${sc.jmeno.padEnd(48)} | ${String(rozvrh.zapasy.length).padStart(3)}z (${skupL}${skupL && plL ? "+" : ""}${plL}) ${trvani.padStart(8)} ${vejde}`);
  if (errs.length === 0) pass++;
  else fails.push({ jmeno: sc.jmeno, errs });
}

console.log(`\nVÝSLEDEK: ${pass}/${scenare.length} OK\n`);
if (fails.length > 0) {
  console.log("=== SELHÁNÍ ===");
  for (const f of fails) {
    console.log(`[FAIL] ${f.jmeno}`);
    for (const e of f.errs) console.log(`   - ${e}`);
  }
  process.exit(1);
}
