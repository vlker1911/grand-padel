export type Hrac = { id: string; jmeno: string };

export type Zapas = {
  kolo: number;
  kurt: number;
  tym1: [string, string];
  tym2: [string, string];
};

export type TabulkaRadek = {
  id: string;
  jmeno: string;
  body: number;
  obdrzeno: number;
  rozdil: number;
  vyhry: number;
  remisy: number;
  prohry: number;
};

export function generujAmericano(hraci: Hrac[], pocetKurtu: number): Zapas[] {
  const n = hraci.length;
  const ids = hraci.map((h) => h.id);
  const zapasy: Zapas[] = [];

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

    for (let k = 0; k < Math.min(Math.floor(pary.length / 2), pocetKurtu); k++) {
      zapasy.push({
        kolo: kolo + 1,
        kurt: k + 1,
        tym1: pary[k * 2],
        tym2: pary[k * 2 + 1],
      });
    }

    const posledni = seznam.pop()!;
    seznam.splice(1, 0, posledni);
  }

  return zapasy;
}

export function spocitejTabulku(
  hraci: Hrac[],
  zapasy: Array<{ tym1: [string, string]; tym2: [string, string]; skore_tym1: number | null; skore_tym2: number | null }>
): TabulkaRadek[] {
  const stats: Record<string, { body: number; obdrzeno: number; vyhry: number; remisy: number; prohry: number }> = {};
  hraci.forEach(h => { stats[h.id] = { body: 0, obdrzeno: 0, vyhry: 0, remisy: 0, prohry: 0 }; });

  for (const z of zapasy) {
    if (z.skore_tym1 == null || z.skore_tym2 == null) continue;
    const s1 = z.skore_tym1, s2 = z.skore_tym2;

    z.tym1.forEach(id => {
      if (!(id in stats)) return;
      stats[id].body += s1;
      stats[id].obdrzeno += s2;
      if (s1 > s2) stats[id].vyhry++;
      else if (s1 === s2) stats[id].remisy++;
      else stats[id].prohry++;
    });

    z.tym2.forEach(id => {
      if (!(id in stats)) return;
      stats[id].body += s2;
      stats[id].obdrzeno += s1;
      if (s2 > s1) stats[id].vyhry++;
      else if (s1 === s2) stats[id].remisy++;
      else stats[id].prohry++;
    });
  }

  return hraci
    .map(h => ({
      id: h.id,
      jmeno: h.jmeno,
      body: stats[h.id].body,
      obdrzeno: stats[h.id].obdrzeno,
      rozdil: stats[h.id].body - stats[h.id].obdrzeno,
      vyhry: stats[h.id].vyhry,
      remisy: stats[h.id].remisy,
      prohry: stats[h.id].prohry,
    }))
    .sort((a, b) => b.body !== a.body ? b.body - a.body : b.rozdil - a.rozdil);
}
