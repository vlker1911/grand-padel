// Helpery pro generovani ceske QR platby (SPAYD).
// Standard: https://qr-platba.cz/pro-vyvojare/specifikace-formatu/
//
// Format: SPD*1.0*ACC:IBAN*AM:castka*CC:CZK[*X-VS:vs][*X-SS:ss][*X-KS:ks][*MSG:zprava]

const VAH = [6, 3, 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5];

// Validace ceskeho cisla uctu pomoci modulo 11.
// prefix: 0-6 cislic, cislo: 2-10 cislic, banka: 4 cislice.
export function validujCisloUctu(prefix: string, cislo: string, banka: string): boolean {
  if (!/^\d{0,6}$/.test(prefix)) return false;
  if (!/^\d{2,10}$/.test(cislo)) return false;
  if (!/^\d{4}$/.test(banka)) return false;
  // Modulo 11 kontrola pro prefix i cislo
  function modulo11(s: string): boolean {
    const padded = s.padStart(10, "0");
    let sum = 0;
    for (let i = 0; i < padded.length; i++) {
      sum += parseInt(padded[i], 10) * VAH[i + (16 - padded.length)];
    }
    return sum % 11 === 0;
  }
  if (prefix && !modulo11(prefix)) return false;
  if (!modulo11(cislo)) return false;
  return true;
}

// Konverze ceskeho cisla uctu na IBAN.
// IBAN CZ: "CZ" + 2 kontrolni cislice + banka(4) + prefix(6) + cislo(10) = 24 znaku
export function cisloUctuNaIBAN(prefix: string, cislo: string, banka: string): string {
  const p = (prefix || "0").padStart(6, "0");
  const c = cislo.padStart(10, "0");
  const b = banka.padStart(4, "0");
  // BBAN = banka(4) + prefix(6) + cislo(10)
  const bban = b + p + c;
  // IBAN check: presun "CZ00" na konec, pismena na cisla (C=12, Z=35)
  const tmp = bban + "122300"; // C=12, Z=35, 00 placeholder
  // Mod 97 (po jednotlivych cislech kvuli velkym cislum)
  let rem = 0;
  for (const ch of tmp) {
    rem = (rem * 10 + parseInt(ch, 10)) % 97;
  }
  const kontrolni = String(98 - rem).padStart(2, "0");
  return `CZ${kontrolni}${bban}`;
}

// Validace IBAN (zakladni — pro CZ delka a mod 97)
export function validujIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  if (cleaned.length < 15 || cleaned.length > 34) return false;
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) return false;
  // Presun prvni 4 znaky na konec, prevod pismen na cisla
  const moved = cleaned.slice(4) + cleaned.slice(0, 4);
  let numeric = "";
  for (const ch of moved) {
    if (ch >= "A" && ch <= "Z") numeric += String(ch.charCodeAt(0) - 55);
    else numeric += ch;
  }
  let rem = 0;
  for (const ch of numeric) {
    rem = (rem * 10 + parseInt(ch, 10)) % 97;
  }
  return rem === 1;
}

export type SpaydInput = {
  iban: string;
  castka: number | null;       // CZK, 2 desetinna mista. null = bez castky (univerzalni QR)
  vs?: string;
  ks?: string;
  ss?: string;
  zprava?: string;
};

// Encoduje znaky pro SPAYD: nahrazuje hvezdicku a kontrolni znaky.
function escapeSpayd(s: string): string {
  return s
    .replace(/\*/g, "")
    .replace(/[\r\n]/g, " ")
    .toUpperCase()
    .replace(/[ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/g, c => "AČDĚČIŇOŘŠŤÚŮYŽ"[("ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ".indexOf(c))]);
}

export function vytvorSPAYD(input: SpaydInput): string {
  const parts: string[] = ["SPD", "1.0"];
  parts.push(`ACC:${input.iban.replace(/\s/g, "").toUpperCase()}`);
  if (input.castka != null && input.castka > 0) {
    parts.push(`AM:${input.castka.toFixed(2)}`);
  }
  parts.push("CC:CZK");
  if (input.vs && /^\d{1,10}$/.test(input.vs)) parts.push(`X-VS:${input.vs}`);
  if (input.ss && /^\d{1,10}$/.test(input.ss)) parts.push(`X-SS:${input.ss}`);
  if (input.ks && /^\d{1,10}$/.test(input.ks)) parts.push(`X-KS:${input.ks}`);
  if (input.zprava) parts.push(`MSG:${escapeSpayd(input.zprava).slice(0, 60)}`);
  return parts.join("*");
}

// Pohodlna pomocna funkce: cislo uctu primo -> SPAYD
export function spaydZCisla(
  prefix: string, cislo: string, banka: string,
  castka: number | null,
  vs?: string, zprava?: string,
): { spayd: string; iban: string } {
  const iban = cisloUctuNaIBAN(prefix, cislo, banka);
  return { iban, spayd: vytvorSPAYD({ iban, castka, vs, zprava }) };
}
