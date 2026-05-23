// Test pot system seedingu pro 16t/16seed, 32t/32seed, 64t/64seed.
import { rozdelSeSeedingem } from "../src/lib/turnaj-postup.ts";

function vytvorTymy(N, kolikSeeds) {
  const tymy = [];
  for (let i = 0; i < N; i++) {
    tymy.push({
      id: i + 1,
      nazev: `T${i + 1}`,
      nasazeni: i < kolikSeeds ? i + 1 : null,
    });
  }
  return tymy;
}

function vypisRozdeleni(groups) {
  groups.forEach((g, i) => {
    const skupina = String.fromCharCode(65 + i);
    const txt = g.map(t => t.nasazeni != null ? `${t.nasazeni}*` : t.nazev).join(", ");
    console.log(`  ${skupina}: ${txt}`);
  });
}

function ovel(label, tymy, K) {
  console.log(`\n=== ${label} ===`);
  const r = rozdelSeSeedingem(tymy, K);
  vypisRozdeleni(r);
  // Validate: každá skupina má ~ N/K týmů, top K nasazení v různých skupinách
  const velkikosti = r.map(g => g.length);
  console.log(`  Velikosti: ${velkikosti.join(", ")}`);
  // Top K nasazení (1..K)
  const topKSkupin = new Set();
  for (let i = 0; i < K; i++) {
    const idx = r.findIndex(g => g.some(t => t.nasazeni === i + 1));
    topKSkupin.add(idx);
  }
  console.log(`  Top ${K} nasazení v ${topKSkupin.size} unikátních skupinách ${topKSkupin.size === K ? "✓" : "X"}`);
  // 1. a (K+1). nasazený v různých skupinách (cross-pot)
  const skupina1 = r.findIndex(g => g.some(t => t.nasazeni === 1));
  const skupinaKplus1 = r.findIndex(g => g.some(t => t.nasazeni === K + 1));
  if (K + 1 <= tymy.length) {
    console.log(`  1. a ${K + 1}. nasazený: ${skupina1 === skupinaKplus1 ? "STEJNÁ SKUPINA X" : "různé skupiny ✓"}`);
  }
}

// Testovací scénáře
ovel("16t / 4 skupiny / 4 nasazení", vytvorTymy(16, 4), 4);
ovel("16t / 4 skupiny / 8 nasazení", vytvorTymy(16, 8), 4);
ovel("16t / 4 skupiny / 16 nasazení (vše)", vytvorTymy(16, 16), 4);
ovel("32t / 8 skupin / 32 nasazení (vše)", vytvorTymy(32, 32), 8);
ovel("64t / 16 skupin / 64 nasazení (vše)", vytvorTymy(64, 64), 16);
ovel("8t / 2 skupiny / 4 nasazení", vytvorTymy(8, 4), 2);
ovel("12t / 3 skupiny / 6 nasazení", vytvorTymy(12, 6), 3);
ovel("16t / 4 skupiny / 0 nasazení (random)", vytvorTymy(16, 0), 4);
