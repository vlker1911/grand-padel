// Unit testy pro src/lib/dostupnost.ts.
// Spuštění: node --experimental-strip-types scripts/test-dostupnost.mjs
//
// Pokrývá:
//   - prázdný kurt → libovolné platné začátky
//   - navazující rezervace (gap = 0) je OK
//   - 30min mezera UPROSTŘED dne je zakázaná
//   - 30min mezera NA ZAČÁTKU dne (před první rezervací) povolená
//   - 30min mezera NA KONCI dne (po poslední rezervaci) povolená
//   - pravidlo 32h: 30min mezery povolené v blízkém horizontu
//   - filtr "část dne" zahazuje začátky mimo okno
//   - hra se musí vejít do 23:00
//
// Při neúspěchu vyhodí výjimku a vrátí exit code != 0.

import { vypocitejVolneSloty, formatMinuty, OTEVRENO_OD, ZAVRENO_DO } from "../src/lib/dostupnost.ts";

let passed = 0;
let failed = 0;

function eq(a, b, label) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa === sb) {
    passed++;
    console.log(`  OK  ${label}`);
  } else {
    failed++;
    console.log(`  XX  ${label}`);
    console.log(`        ocekavano: ${sb}`);
    console.log(`        dostal:    ${sa}`);
  }
}

function contains(arr, val, label) {
  if (arr.includes(val)) {
    passed++;
    console.log(`  OK  ${label}`);
  } else {
    failed++;
    console.log(`  XX  ${label} — chybi ${val} v [${arr.join(",")}]`);
  }
}

function notContains(arr, val, label) {
  if (!arr.includes(val)) {
    passed++;
    console.log(`  OK  ${label}`);
  } else {
    failed++;
    console.log(`  XX  ${label} — nemelo by tam byt ${val}, ale je: [${arr.join(",")}]`);
  }
}

const KURT = { id: "k1", nazev: "Kurt 1", cislo: 1 };

// Pomocná: dej rezervaci v "HH:MM" formátu
function rez(zacatekHM, konecHM, kurtId = "k1") {
  const [zh, zm] = zacatekHM.split(":").map(Number);
  const [kh, km] = konecHM.split(":").map(Number);
  return { kurtId, zacatekMin: zh * 60 + zm, konecMin: kh * 60 + km };
}

// ===========================================================================
console.log("\n== 1) Prazdny kurt, delka 60, kdykoliv ==");
// ===========================================================================
{
  const v = vypocitejVolneSloty({
    kurty: [KURT],
    rezervace: [],
    delkaMinut: 60,
    castDne: "kdykoliv",
    nowMin: -10_000, // hodne v minulosti -> 32h pravidlo nezasahuje
  });
  // start od 7:00 po 30 min až 22:00 (vcetne) => 31 zacatku
  const ocekavanyPocet = ((22 * 60 - 7 * 60) / 30) + 1; // 31
  eq(v.length, 1, "vraci jeden kurt");
  eq(v[0].zacatky.length, ocekavanyPocet, `pocet zacatku = ${ocekavanyPocet}`);
  eq(v[0].zacatky[0], 7 * 60, "prvni zacatek 07:00");
  eq(v[0].zacatky[v[0].zacatky.length - 1], 22 * 60, "posledni zacatek 22:00");
}

// ===========================================================================
console.log("\n== 2) Navazujici rezervace (gap=0) je OK ==");
// ===========================================================================
{
  // Rezervace 10:00-11:00. Kandidat 9:00-10:00 (gap=0 dopredu) i 11:00-12:00 (gap=0 dozadu) musi byt OK.
  const v = vypocitejVolneSloty({
    kurty: [KURT],
    rezervace: [rez("10:00", "11:00")],
    delkaMinut: 60,
    castDne: "kdykoliv",
    nowMin: -10_000,
  });
  contains(v[0].zacatky, 9 * 60, "9:00 (navazuje na 10:00)");
  contains(v[0].zacatky, 11 * 60, "11:00 (navazuje z 11:00)");
  // overlap nesmi projit:
  notContains(v[0].zacatky, 10 * 60, "10:00 je obsazene");
  notContains(v[0].zacatky, 9 * 60 + 30, "9:30 by koncilo 10:30, overlap");
}

// ===========================================================================
console.log("\n== 3) Zakazana 30min mezera uprostred dne ==");
// ===========================================================================
{
  // Rezervace 10:00-11:00 a 15:00-16:00. Den daleko v budoucnu (32h pravidlo neplati).
  const v = vypocitejVolneSloty({
    kurty: [KURT],
    rezervace: [rez("10:00", "11:00"), rez("15:00", "16:00")],
    delkaMinut: 60,
    castDne: "kdykoliv",
    nowMin: -10_000,
  });
  // Kandidat 11:30-12:30 ma gap=30 od konce predchozi (11:00) a >60 od dalsi (15:00).
  // 30min mezera NENI na zacatku dne (pred je rezervace 10:00) ani na konci -> ZAKAZANO.
  notContains(v[0].zacatky, 11 * 60 + 30, "11:30 zakazano (30min dira po 11:00)");
  // 13:30-14:30: gap pred = 13:30-11:00 = 150 OK, gap po = 15:00-14:30 = 30 → uprostred dne ZAKAZANO
  notContains(v[0].zacatky, 13 * 60 + 30, "13:30 zakazano (30min dira pred 15:00)");
  // 12:00-13:00: gap pred = 12:00-11:00 = 60 OK, gap po = 15:00-13:00 = 120 OK
  contains(v[0].zacatky, 12 * 60, "12:00 OK (mezera 60 a 120)");
  // 11:00 navazuje primo na 11:00 -> overlap = false (konec 12:00 > 11:00 zacatek=10:00? ne)
  // 11:00-12:00 vs rez 10:00-11:00: konec 12 > zacatek 10? ano; kand 11 < konec 11? ne. -> nepřekrývá. Gap pred = 0 OK.
  contains(v[0].zacatky, 11 * 60, "11:00 navazuje (gap=0)");
}

// ===========================================================================
console.log("\n== 4) 30min mezera NA ZACATKU dne povolena ==");
// ===========================================================================
{
  // Den daleko v budoucnu. Existuje jen rezervace 9:00-10:00 (PRVNI rezervace).
  // Kandidat 7:30-8:30: PRED kandidatem zadna rezervace (prev=null), gap po = 9:00-8:30 = 30 → ZACATEK DNE → OK.
  const v = vypocitejVolneSloty({
    kurty: [KURT],
    rezervace: [rez("9:00", "10:00")],
    delkaMinut: 60,
    castDne: "kdykoliv",
    nowMin: -10_000,
  });
  contains(v[0].zacatky, 7 * 60 + 30, "7:30 OK (30min mezera na zacatku dne)");
  // 8:00-9:00 → gap=0 OK
  contains(v[0].zacatky, 8 * 60, "8:00 navazuje na 9:00");
  // 7:00-8:00 → gap po = 9:00-8:00 = 60 OK
  contains(v[0].zacatky, 7 * 60, "7:00 OK (mezera 60)");
}

// ===========================================================================
console.log("\n== 5) 30min mezera NA KONCI dne povolena ==");
// ===========================================================================
{
  // Posledni rezervace 20:00-21:00. Kandidat 21:30-22:30:
  // prev=21:00, gap=30, next=null → KONEC DNE → OK.
  const v = vypocitejVolneSloty({
    kurty: [KURT],
    rezervace: [rez("20:00", "21:00")],
    delkaMinut: 60,
    castDne: "kdykoliv",
    nowMin: -10_000,
  });
  contains(v[0].zacatky, 21 * 60 + 30, "21:30 OK (30min mezera na konci dne)");
  // 22:00 → gap=60 OK
  contains(v[0].zacatky, 22 * 60, "22:00 OK (mezera 60)");
}

// ===========================================================================
console.log("\n== 6) Pravidlo 32h: 30min dira uprostred dne povolena v blizkem horizontu ==");
// ===========================================================================
{
  // Stejna data jako test 3, ale dnes je "ten den" → nowMin = 0 → vse do 32:00 (32h) je pod prahem.
  // Kandidat 11:30-12:30 (=> kand = 690 < 32*60 = 1920) → projde i pres 30min diru.
  const v = vypocitejVolneSloty({
    kurty: [KURT],
    rezervace: [rez("10:00", "11:00"), rez("15:00", "16:00")],
    delkaMinut: 60,
    castDne: "kdykoliv",
    nowMin: 0,
  });
  contains(v[0].zacatky, 11 * 60 + 30, "11:30 OK (32h pravidlo)");
  contains(v[0].zacatky, 13 * 60 + 30, "13:30 OK (32h pravidlo)");
}

// ===========================================================================
console.log("\n== 7) Filtr 'rano' (7-11) zahazuje pozdejsi zacatky ==");
// ===========================================================================
{
  const v = vypocitejVolneSloty({
    kurty: [KURT],
    rezervace: [],
    delkaMinut: 60,
    castDne: "rano",
    nowMin: -10_000,
  });
  contains(v[0].zacatky, 7 * 60, "07:00 je v okne");
  contains(v[0].zacatky, 10 * 60 + 30, "10:30 je v okne (zacina pred 11:00)");
  notContains(v[0].zacatky, 11 * 60, "11:00 uz mimo (vecer/poledne)");
}

// ===========================================================================
console.log("\n== 8) Hra se musi vejit do 23:00 ==");
// ===========================================================================
{
  // Delka 120, 'vecer'. Posledni mozny zacatek 21:00 (skonci 23:00). 21:30 by skoncilo 23:30 → ne.
  const v = vypocitejVolneSloty({
    kurty: [KURT],
    rezervace: [],
    delkaMinut: 120,
    castDne: "vecer",
    nowMin: -10_000,
  });
  contains(v[0].zacatky, 21 * 60, "21:00 OK (do 23:00)");
  notContains(v[0].zacatky, 21 * 60 + 30, "21:30 zahozeno (skoncilo by 23:30)");
}

// ===========================================================================
console.log("\n== 9) Dlouha hra 300min v plnem dni ==");
// ===========================================================================
{
  // Prazdny kurt, delka 300 (5h). Posledni zacatek 18:00 (konci 23:00).
  const v = vypocitejVolneSloty({
    kurty: [KURT],
    rezervace: [],
    delkaMinut: 300,
    castDne: "kdykoliv",
    nowMin: -10_000,
  });
  contains(v[0].zacatky, 7 * 60, "7:00 OK");
  contains(v[0].zacatky, 18 * 60, "18:00 OK (konec 23:00)");
  notContains(v[0].zacatky, 18 * 60 + 30, "18:30 ne (skoncilo by 23:30)");
}

// ===========================================================================
console.log("\n== 10) Vice kurtu se zpracovavaji nezavisle ==");
// ===========================================================================
{
  const KURT2 = { id: "k2", nazev: "Kurt 2", cislo: 2 };
  const v = vypocitejVolneSloty({
    kurty: [KURT, KURT2],
    rezervace: [rez("10:00", "11:00", "k1")], // jen na k1
    delkaMinut: 60,
    castDne: "kdykoliv",
    nowMin: -10_000,
  });
  eq(v.length, 2, "dva kurty na vystupu");
  notContains(v.find((x) => x.kurt.id === "k1").zacatky, 10 * 60, "k1 nema 10:00 (obsazeno)");
  contains(v.find((x) => x.kurt.id === "k2").zacatky, 10 * 60, "k2 ma 10:00 (volny)");
}

// ===========================================================================
console.log(`\n== Vysledek: passed=${passed}, failed=${failed} ==`);
if (failed > 0) process.exit(1);
