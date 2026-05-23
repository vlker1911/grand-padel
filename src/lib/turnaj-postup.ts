// Logika postupu týmů ze skupinové fáze do druhé fáze.
//
// Po dohrání skupin spočítáme tabulku každé skupiny (V/R/P + skóre)
// a vrátíme globální ranking 1A, 1B, 1C, …, 2A, 2B, … který engine
// použije k dosazení konkrétních tym_id do placeholderů 2. fáze.

export type TymBase = {
  id: string;
  nazev: string;
  skupina: string | null;
};

export type ZapasBase = {
  tym1_id: string | null;
  tym2_id: string | null;
  skore_tym1: number | null;
  skore_tym2: number | null;
  skupina: string | null;
  faze: string | null;
};

export type TabulkaRadek<T extends TymBase> = T & {
  vyhry: number;
  remisy: number;
  prohry: number;
  skore: number;
  obdrzeno: number;
  body: number;     // 2 za vyhru, 1 za remizu, 0 za prohru
  rozdil: number;   // skore - obdrzeno
};

// Spočítá tabulku jedné skupiny (V/R/P + skóre, seřazené body desc, rozdíl desc).
export function spocitejSkupinu<T extends TymBase>(
  tymy: T[],
  zapasy: ZapasBase[],
): TabulkaRadek<T>[] {
  const stats: Record<string, {
    vyhry: number; remisy: number; prohry: number;
    skore: number; obdrzeno: number;
  }> = {};
  for (const t of tymy) {
    stats[t.id] = { vyhry: 0, remisy: 0, prohry: 0, skore: 0, obdrzeno: 0 };
  }
  for (const z of zapasy) {
    if (z.skore_tym1 == null || z.skore_tym2 == null) continue;
    if (!z.tym1_id || !z.tym2_id) continue;
    const s1 = z.skore_tym1, s2 = z.skore_tym2;
    if (stats[z.tym1_id]) {
      stats[z.tym1_id].skore += s1;
      stats[z.tym1_id].obdrzeno += s2;
      if (s1 > s2) stats[z.tym1_id].vyhry++;
      else if (s1 === s2) stats[z.tym1_id].remisy++;
      else stats[z.tym1_id].prohry++;
    }
    if (stats[z.tym2_id]) {
      stats[z.tym2_id].skore += s2;
      stats[z.tym2_id].obdrzeno += s1;
      if (s2 > s1) stats[z.tym2_id].vyhry++;
      else if (s1 === s2) stats[z.tym2_id].remisy++;
      else stats[z.tym2_id].prohry++;
    }
  }
  return tymy
    .map(t => ({
      ...t,
      ...stats[t.id],
      body: stats[t.id].vyhry * 2 + stats[t.id].remisy,
      rozdil: stats[t.id].skore - stats[t.id].obdrzeno,
    }))
    .sort((a, b) => b.body !== a.body ? b.body - a.body : b.rozdil - a.rozdil);
}

// Vrátí mapování label -> tym_id pro placeholdery z engine.
// Label format: "1.A", "2.B", "3.C", ... (pozice ve skupině + jméno skupiny).
//
// Použití:
//   const map = poradiSkupin(tymy, zapasySkupin);
//   map["1.A"] -> "real-team-uuid"
export function poradiSkupin<T extends TymBase>(
  vsechnyTymy: T[],
  zapasySkupin: ZapasBase[],
): Record<string, string> {
  const mapa: Record<string, string> = {};
  // Rozdel tymy do skupin
  const podleSkupin: Record<string, T[]> = {};
  for (const t of vsechnyTymy) {
    const sk = t.skupina;
    if (!sk) continue;
    (podleSkupin[sk] ??= []).push(t);
  }
  for (const sk of Object.keys(podleSkupin)) {
    const tabulka = spocitejSkupinu(podleSkupin[sk], zapasySkupin.filter(z => z.skupina === sk));
    tabulka.forEach((t, idx) => {
      mapa[`${idx + 1}.${sk}`] = t.id;
    });
  }
  return mapa;
}

// Globální nasazení napříč skupinami pro placeholdery jako "1." (multi-tier).
// Vrací mapu "1." -> tym_id, "2." -> tym_id, … podle interleaved řazení:
// 1A, 1B, 1C, 2A, 2B, 2C, 3A, 3B, …
export function globalniNasazeni<T extends TymBase>(
  vsechnyTymy: T[],
  zapasySkupin: ZapasBase[],
): Record<string, string> {
  const podleSkupin: Record<string, T[]> = {};
  for (const t of vsechnyTymy) {
    const sk = t.skupina;
    if (!sk) continue;
    (podleSkupin[sk] ??= []).push(t);
  }
  const skupNames = Object.keys(podleSkupin).sort();
  const tabulkyPerSkupina: Record<string, TabulkaRadek<T>[]> = {};
  for (const sk of skupNames) {
    tabulkyPerSkupina[sk] = spocitejSkupinu(podleSkupin[sk], zapasySkupin.filter(z => z.skupina === sk));
  }
  const mapa: Record<string, string> = {};
  const maxPos = Math.max(0, ...skupNames.map(sk => tabulkyPerSkupina[sk].length));
  let globalniPoradi = 0;
  for (let pos = 0; pos < maxPos; pos++) {
    for (const sk of skupNames) {
      const t = tabulkyPerSkupina[sk][pos];
      if (!t) continue;
      globalniPoradi++;
      mapa[`${globalniPoradi}.`] = t.id;
    }
  }
  return mapa;
}

// Zkontroluje zda jsou všechny skupinové zápasy dohrané (mají skóre).
export function jsouSkupinyDohrane(zapasySkupin: ZapasBase[]): boolean {
  if (zapasySkupin.length === 0) return false;
  return zapasySkupin.every(z => z.skore_tym1 != null && z.skore_tym2 != null);
}

// ===== Seeding (nasazené týmy + pot system) =====
//
// Vstup: pole týmů, z nichž některé mají `nasazeni: number` (1, 2, 3, …)
//        a počet skupin K.
//
// Výstup: K skupin × (n/K) týmů, kde:
//   - Pot 1 (nasazení 1..K): každý do jiné skupiny (random permutace)
//   - Pot 2 (K+1..2K): cross-pot — opačně k pot 1 (proti shora)
//   - Pot 3+ (2K+1..): random permutace (fair)
//   - Ne-nasazené týmy: vyplní zbytek round-robin
//
// Zaručuje:
//   * Top K nasazení JSOU v různých skupinách
//   * 1. a (K+1). nasazený NEJSOU ve stejné skupině (díky cross-pot)
//   * Hlubší poty jsou random — neopakovatelné, fair-play
//
// Příklad pro 16 týmů / 4 skupiny + všech 16 nasazení (1..16):
//   Pot 1 (1-4) → např. {A:1, B:2, C:3, D:4}
//   Pot 2 (5-8) → cross: {A:8, B:7, C:6, D:5}
//   Pot 3 (9-12) → random: např. {A:11, B:9, C:12, D:10}
//   Pot 4 (13-16) → random: např. {A:14, B:16, C:13, D:15}

export type TymPodleNasazeni<T> = T & { nasazeni?: number | null };

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function rozdelSeSeedingem<T extends TymPodleNasazeni<unknown>>(
  tymy: T[],
  numSkupin: number,
): T[][] {
  if (numSkupin <= 0) return [tymy];
  const groups: T[][] = Array.from({ length: numSkupin }, () => []);
  const nasazene = tymy
    .filter(t => typeof t.nasazeni === "number" && (t.nasazeni as number) > 0)
    .sort((a, b) => (a.nasazeni ?? 99999) - (b.nasazeni ?? 99999));
  const ostatni = tymy.filter(t => typeof t.nasazeni !== "number" || (t.nasazeni as number) <= 0);

  let predchoziPermutace: number[] | null = null;
  for (let p = 0; p * numSkupin < nasazene.length; p++) {
    const pot = nasazene.slice(p * numSkupin, (p + 1) * numSkupin);
    let permutace: number[];
    if (p === 1 && predchoziPermutace) {
      // Cross-pot pro pot 2 — opačné pořadí k pot 1 (zaručí že 1. a (K+1). nasazený jsou v různých skupinách)
      permutace = predchoziPermutace.slice().reverse();
    } else {
      // Pot 1 i hlubší: náhodná permutace skupin
      permutace = shuffleInPlace([...Array(numSkupin).keys()]);
    }
    pot.forEach((tym, i) => groups[permutace[i]].push(tym));
    predchoziPermutace = permutace;
    if (pot.length < numSkupin) break;
  }

  // Ne-nasazené týmy doplnit do skupin (random pořadí, pak round-robin do nejmenší)
  const ostatniShuffled = shuffleInPlace([...ostatni]);
  for (const t of ostatniShuffled) {
    const najmensi = groups.reduce((min, g, i) => g.length < groups[min].length ? i : min, 0);
    groups[najmensi].push(t);
  }
  return groups;
}
