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
