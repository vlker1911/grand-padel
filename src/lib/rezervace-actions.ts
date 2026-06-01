"use server";

// Server actions pro rezervační systém.
// Server-side validace = jediný zdroj pravdy o tom, jestli slot lze rezervovat.
// Stejný kód `vypocitejVolneSloty` jako klient, ale spuštěný čerstvě nad daty z DB
// těsně před INSERTem — eliminuje race conditions.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  vypocitejVolneSloty,
  pulnocPrahaToUTC,
  formatMinuty,
  type KurtVypocet,
  type RezervaceVypocet,
} from "@/lib/dostupnost";

export type VytvorRezervaciStav =
  | { ok: true; id: string }
  | { ok: false; chyba: string };

const POVOLENE_DELKY = new Set([60, 90, 120, 180, 240, 300, 360]);

function nezapornaMinuta(min: number): boolean {
  return Number.isInteger(min) && min >= 0 && min < 24 * 60 && min % 30 === 0;
}

/**
 * Pokusí se založit rezervaci. Validace běží zde, ne na klientu — neměnit
 * skladbu kontrol, je to obrana proti přímému POSTu na endpoint.
 */
export async function vytvorRezervaci(input: {
  kurtId: string;
  datum: string;       // YYYY-MM-DD (Praha)
  zacatekMin: number;  // minuty od půlnoci Praha
  delkaMinut: number;
}): Promise<VytvorRezervaciStav> {
  const { kurtId, datum, zacatekMin, delkaMinut } = input;

  // --- 1) Sanity check vstupu (defense in depth, formulář už to omezí) ---
  if (typeof kurtId !== "string" || kurtId.length < 30) {
    return { ok: false, chyba: "Neplatný kurt." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
    return { ok: false, chyba: "Neplatné datum." };
  }
  if (!POVOLENE_DELKY.has(delkaMinut)) {
    return { ok: false, chyba: "Neplatná délka hry." };
  }
  if (!nezapornaMinuta(zacatekMin)) {
    return { ok: false, chyba: "Neplatný začátek." };
  }
  if (zacatekMin < 7 * 60 || zacatekMin + delkaMinut > 23 * 60) {
    return { ok: false, chyba: "Hra musí být v otevírací době 7:00–23:00." };
  }

  const supabase = await createClient();

  // --- 2) Auth ---
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, chyba: "Pro rezervaci musíte být přihlášeni." };
  }

  // --- 3) Kurt existuje, je aktivní a patří k pobočce v Olomouci ---
  const { data: kurt, error: ek } = await supabase
    .from("kurty")
    .select("id, nazev, cislo, je_center, je_aktivni, pobocka_id, pobocky:pobocka_id(mesto)")
    .eq("id", kurtId)
    .maybeSingle();
  if (ek) return { ok: false, chyba: ek.message };
  if (!kurt || !kurt.je_aktivni) {
    return { ok: false, chyba: "Kurt není dostupný k rezervaci." };
  }
  type PobockaJoin = { mesto?: string } | { mesto?: string }[] | null;
  const pobockyRaw: PobockaJoin = (kurt as { pobocky?: PobockaJoin }).pobocky ?? null;
  const mesto = Array.isArray(pobockyRaw) ? pobockyRaw[0]?.mesto : pobockyRaw?.mesto;
  if (mesto !== "Olomouc") {
    return { ok: false, chyba: "Tato pobočka zatím nepřijímá rezervace." };
  }

  // --- 4) Datum smí být dnes nebo do +14 dní (Praha) ---
  const dnesMs = pulnocPrahaToUTC(formatDnesPraha());
  const datumMs = pulnocPrahaToUTC(datum);
  const denyDopredu = Math.round((datumMs - dnesMs) / 86_400_000);
  if (denyDopredu < 0 || denyDopredu > 14) {
    return { ok: false, chyba: "Datum musí být ode dneška do 14 dní dopředu." };
  }

  // --- 5) Načti existující rezervace na tom kurtu pro daný den ---
  const denOd = new Date(datumMs);
  const denDo = new Date(datumMs + 86_400_000);
  const { data: rezDb, error: er } = await supabase
    .from("rezervace")
    .select("kurt_id, zacatek, konec, stav")
    .eq("kurt_id", kurtId)
    .eq("stav", "potvrzena")
    .lt("zacatek", denDo.toISOString())
    .gt("konec", denOd.toISOString());
  if (er) return { ok: false, chyba: er.message };

  const pulnocMs = datumMs;
  const rezervace: RezervaceVypocet[] = (rezDb ?? []).map((r) => ({
    kurtId: r.kurt_id as string,
    zacatekMin: Math.max(0, Math.round((new Date(r.zacatek as string).getTime() - pulnocMs) / 60000)),
    konecMin:   Math.min(24 * 60, Math.round((new Date(r.konec   as string).getTime() - pulnocMs) / 60000)),
  }));

  // --- 6) Znovu spočítat dostupnost a ověřit, že kandidát je ve výsledku ---
  const kurtForCalc: KurtVypocet = {
    id: kurt.id as string,
    nazev: kurt.nazev as string,
    cislo: kurt.cislo as number,
    jeCenter: !!kurt.je_center,
  };
  const nowMin = Math.round((Date.now() - pulnocMs) / 60000);
  const slotyKdykoliv = vypocitejVolneSloty({
    kurty: [kurtForCalc],
    rezervace,
    delkaMinut,
    castDne: "kdykoliv",
    nowMin,
  });
  const dostupneZacatky = new Set(slotyKdykoliv[0]?.zacatky ?? []);
  if (!dostupneZacatky.has(zacatekMin)) {
    return {
      ok: false,
      chyba: `Slot ${formatMinuty(zacatekMin)} už není volný nebo nesplňuje pravidla rozvrhu.`,
    };
  }

  // --- 7) INSERT (poslední krok, vše předtím je validace) ---
  const zacatekIso = new Date(pulnocMs + zacatekMin * 60_000).toISOString();
  const konecIso   = new Date(pulnocMs + (zacatekMin + delkaMinut) * 60_000).toISOString();
  const { data: vlozeno, error: ei } = await supabase
    .from("rezervace")
    .insert({
      pobocka_id: kurt.pobocka_id as string,
      kurt_id: kurtId,
      uzivatel_id: user.id,
      zacatek: zacatekIso,
      konec: konecIso,
      delka_minut: delkaMinut,
      stav: "potvrzena",
    })
    .select("id")
    .single();
  if (ei || !vlozeno) {
    return { ok: false, chyba: ei?.message ?? "INSERT selhal." };
  }
  return { ok: true, id: vlozeno.id as string };
}

/**
 * Formulářový wrapper okolo vytvorRezervaci — volá se z `<form action={...}>`.
 * Při úspěchu redirectuje na potvrzovací stránku, při chybě hodí výjimku
 * (Next ji ukáže přes klientskou error UI).
 */
export async function vytvorRezervaciFormAction(formData: FormData): Promise<void> {
  const kurtId = String(formData.get("kurtId") ?? "");
  const datum = String(formData.get("datum") ?? "");
  const zacatekMin = Number(formData.get("zacatekMin") ?? "");
  const delkaMinut = Number(formData.get("delkaMinut") ?? "");
  const stav = await vytvorRezervaci({ kurtId, datum, zacatekMin, delkaMinut });
  if (!stav.ok) {
    throw new Error(stav.chyba);
  }
  redirect(`/rezervace/dostupnost/nova/${stav.id}`);
}

function formatDnesPraha(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
