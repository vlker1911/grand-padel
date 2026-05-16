export type Hrac = { id: string; jmeno: string };

export type Zapas = {
  kolo: number;
  kurt: number;
  tym1: [string, string];
  tym2: [string, string];
};

export function generujAmericano(hraci: Hrac[], pocetKurtu: number): Zapas[] {
  const n = hraci.length;
  const ids = hraci.map((h) => h.id);
  const zapasy: Zapas[] = [];

  // Počet kol = n - 1 (každý hraje s každým jako partner alespoň jednou)
  // Používáme round-robin rotaci
  const seznam = [...ids];
  if (n % 2 !== 0) seznam.push("volno");

  const pocetKol = seznam.length - 1;

  for (let kolo = 0; kolo < pocetKol; kolo++) {
    const pary: [string, string][] = [];

    for (let i = 0; i < seznam.length / 2; i++) {
      const a = seznam[i];
      const b = seznam[seznam.length - 1 - i];
      if (a !== "volno" && b !== "volno") {
        pary.push([a, b]);
      }
    }

    // Párujeme dvojice proti sobě na kurtech
    for (let k = 0; k < Math.min(Math.floor(pary.length / 2), pocetKurtu); k++) {
      zapasy.push({
        kolo: kolo + 1,
        kurt: k + 1,
        tym1: pary[k * 2],
        tym2: pary[k * 2 + 1],
      });
    }

    // Rotace: první zůstane, ostatní se posunou
    const posledni = seznam.pop()!;
    seznam.splice(1, 0, posledni);
  }

  return zapasy;
}

export function spocitejTabulku(
  hraci: Hrac[],
  zapasy: Array<{ tym1: [string, string]; tym2: [string, string]; skore_tym1: number | null; skore_tym2: number | null }>
) {
  const skore: Record<string, number> = {};
  hraci.forEach((h) => (skore[h.id] = 0));

  for (const z of zapasy) {
    if (z.skore_tym1 == null || z.skore_tym2 == null) continue;
    z.tym1.forEach((id) => { if (id in skore) skore[id] += z.skore_tym1!; });
    z.tym2.forEach((id) => { if (id in skore) skore[id] += z.skore_tym2!; });
  }

  return hraci
    .map((h) => ({ ...h, body: skore[h.id] }))
    .sort((a, b) => b.body - a.body);
}
