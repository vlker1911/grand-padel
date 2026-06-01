// Výpočet volných slotů pro rezervační systém Grand Padel (FÁZE 2 – jen čtení / dostupnost).
//
// Tato logika je záměrně oddělená od UI i od Supabase, aby šla testovat bez DB.
// Vstupem je seznam kurtů a existujících rezervací (už filtrované na stav='potvrzena'
// a na zvolený den), parametry filtru a aktuální čas. Výstupem je pro každý kurt
// seznam povolených začátků her.

export type Castdne = "rano" | "poledne" | "odpoledne" | "vecer" | "kdykoliv";

export type KurtVypocet = {
  id: string;
  nazev: string;
  cislo: number;
  jeCenter?: boolean;
};

export type RezervaceVypocet = {
  kurtId: string;
  // minuty od půlnoci dne v Praze; mimo den (přesah přes půlnoc) klipne volající
  zacatekMin: number;
  konecMin: number;
};

export type VolneSlotyKurt = {
  kurt: KurtVypocet;
  zacatky: number[];
};

export const OTEVRENO_OD = 7 * 60;   // 07:00
export const ZAVRENO_DO = 23 * 60;   // 23:00

// Filtr "část dne" se vztahuje na ZAČÁTEK hry (kdy se rozsvítí kurt),
// ne na konec — viz zadání: ráno 7–11, poledne 11–14, odpoledne 14–18, večer 18–23.
const CAST_DNE_OKNO: Record<Castdne, [number, number]> = {
  rano:      [7 * 60,  11 * 60],
  poledne:   [11 * 60, 14 * 60],
  odpoledne: [14 * 60, 18 * 60],
  vecer:     [18 * 60, 23 * 60],
  kdykoliv:  [7 * 60,  23 * 60],
};

/**
 * Pro každý aktivní kurt vrátí seznam začátků hry, které jsou volné.
 * Začátky chodí po 30 minutách. Hra musí celá ležet v okně 7:00–23:00.
 *
 * Pravidlo MEZER (klíčové, eliminuje 30min díry):
 *   Mezi kandidátem a každou sousední existující rezervací na stejném kurtu
 *   musí být mezera 0 (navazují) NEBO ≥ 60 min. Mezera 30 min je zakázaná.
 * Výjimky, kdy 30min mezera projde:
 *   1) Není-li PŘED kandidátem žádná rezervace, smí být 30min mezera mezi
 *      koncem kandidáta a začátkem následující rezervace (= začátek dne).
 *   2) Není-li ZA kandidátem žádná rezervace, smí být 30min mezera mezi
 *      koncem předchozí rezervace a začátkem kandidáta (= konec dne).
 *   3) Pravidlo 32h: pokud kandidát začíná do 32 h od `nowMin`, 30min díry
 *      se povolují i uprostřed dne.
 *   4) Prázdný kurt celý den: libovolný platný začátek je OK.
 */
export function vypocitejVolneSloty(input: {
  kurty: KurtVypocet[];
  rezervace: RezervaceVypocet[]; // už jen stav='potvrzena' a na daný den
  delkaMinut: number;
  castDne: Castdne;
  nowMin: number; // "teď" jako minuty od půlnoci vybraného dne v Praze; pro budoucí den záporné
}): VolneSlotyKurt[] {
  const { kurty, rezervace, delkaMinut, castDne, nowMin } = input;
  const [filtrOd, filtrDo] = CAST_DNE_OKNO[castDne];
  const prah32h = nowMin + 32 * 60;

  const minStart = Math.max(OTEVRENO_OD, filtrOd);
  // Začátek musí být uvnitř okna „část dne" a hra se musí vejít do 23:00.
  const maxStartByOkno = filtrDo - 30;       // poslední přípustný start z hlediska okna (< filtrDo)
  const maxStartByDelka = ZAVRENO_DO - delkaMinut;
  const maxStart = Math.min(maxStartByOkno, maxStartByDelka);

  const out: VolneSlotyKurt[] = [];

  for (const kurt of kurty) {
    const rezKurtu = rezervace
      .filter((r) => r.kurtId === kurt.id)
      .sort((a, b) => a.zacatekMin - b.zacatekMin);
    const prazdny = rezKurtu.length === 0;

    const zacatky: number[] = [];
    for (let kand = minStart; kand <= maxStart; kand += 30) {
      const konec = kand + delkaMinut;

      // 1) překryv s existující rezervací
      let overlap = false;
      for (const r of rezKurtu) {
        if (konec > r.zacatekMin && kand < r.konecMin) {
          overlap = true;
          break;
        }
      }
      if (overlap) continue;

      // 2) prázdný kurt — vše OK
      if (prazdny) {
        zacatky.push(kand);
        continue;
      }

      // 3) pravidlo 32h — uvnitř blízkého horizontu se 30min díry tolerují
      if (kand < prah32h) {
        zacatky.push(kand);
        continue;
      }

      // 4) najdi nejbližší předchozí a následující rezervaci na tomto kurtu
      let prev: RezervaceVypocet | null = null;
      let next: RezervaceVypocet | null = null;
      for (const r of rezKurtu) {
        if (r.konecMin <= kand) prev = r;            // poslední taková
        else if (r.zacatekMin >= konec && next === null) next = r;
      }

      const okPred = (() => {
        if (!prev) return true;                       // před kandidátem nic není
        const gap = kand - prev.konecMin;
        if (gap === 0 || gap >= 60) return true;
        if (gap === 30 && !next) return true;         // konec dne (výjimka 2)
        return false;
      })();

      const okPo = (() => {
        if (!next) return true;
        const gap = next.zacatekMin - konec;
        if (gap === 0 || gap >= 60) return true;
        if (gap === 30 && !prev) return true;         // začátek dne (výjimka 1)
        return false;
      })();

      if (okPred && okPo) zacatky.push(kand);
    }

    out.push({ kurt, zacatky });
  }
  return out;
}

/** "HH:MM" formát minut od půlnoci. */
export function formatMinuty(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** YYYY-MM-DD dnešního dne v Europe/Prague. */
export function dnesPraha(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Vrátí UNIX ms odpovídající 00:00 v Europe/Prague daného dne. */
export function pulnocPrahaToUTC(datumPraha: string): number {
  const [y, m, d] = datumPraha.split("-").map(Number);
  const utcMid = Date.UTC(y, m - 1, d, 0, 0, 0);
  // Zjisti, kolik ukazují hodiny v Praze v okamžiku UTC půlnoci toho dne.
  // (offset se mění mezi CET/CEST.)
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(utcMid));
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  // V UTC půlnoci je v Praze hh:mm dopředu → Praha půlnoc = utcMid - (hh*60+mm) min.
  // (Funguje to i v okolí přechodu DST, protože hh*60+mm je posun Prahy oproti UTC v daný okamžik.)
  return utcMid - (hh * 60 + mm) * 60_000;
}

/** Konverze (Date) → minuty od půlnoci v Praze daného dne. */
export function minutyOdPulnociPraha(okamzik: Date, datumPraha: string): number {
  const pulnocMs = pulnocPrahaToUTC(datumPraha);
  return Math.round((okamzik.getTime() - pulnocMs) / 60000);
}

/** Vrátí YYYY-MM-DD posunutý o `dni` dní od `od` (v Praze). */
export function pridejDny(od: string, dni: number): string {
  const ms = pulnocPrahaToUTC(od) + dni * 86_400_000;
  return dnesPraha(new Date(ms));
}
