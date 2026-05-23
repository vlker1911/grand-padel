// Grand Padel brand tokeny — JEDEN zdroj pro kód.
// Hodnoty pocházejí z vizual/barvy/paleta.md a vizual/typografie/fonty.md.
// Když grafik dodá finál, mění se POUZE tento soubor.

export const brand = {
  colors: {
    red: "#8C1325",
    redHover: "#761020",
    redActive: "#5F0C19",
    black: "#0A0A0A",
    white: "#FFFFFF",
    cream: "#F2EDE4",
    zincLight: "#F5F4F1",
    zincBorder: "#E5E3DE",
    muted: "#6b7280",
  },
  fonts: {
    headline: "Poppins, system-ui, sans-serif",
    body: "Poppins, system-ui, sans-serif",
    logoDisplay: "Poppins, system-ui, sans-serif",
  },
  logo: {
    fullPng: "/gp-logo-full.png",
    monogramPng: "/gp-logo-monogram.png",
  },
};

export const TYPY_SPOLUPRACE = [
  { value: "sponzoring", label: "Sponzoring" },
  { value: "firemni_turnaj", label: "Firemní turnaj / teambuilding" },
  { value: "pronajem_kurtu", label: "Pronájem kurtu (firmy)" },
  { value: "b2b_partner", label: "B2B partner (dodavatel, agentura)" },
] as const;

export const LOKALITY = [
  { value: "olomouc", label: "Olomouc", podtitul: "otevření říjen 2026" },
  { value: "ostrava", label: "Ostrava", podtitul: "otevření prosinec 2026" },
  { value: "praha_zlicin", label: "Praha Zličín", podtitul: "otevření únor–březen 2027" },
  { value: "cela_cr", label: "Celá ČR", podtitul: "všechna centra" },
] as const;

export const VELIKOSTI_FIRMY = [
  { value: "mala", label: "Malá", podtitul: "do 50 zaměstnanců" },
  { value: "stredni", label: "Střední", podtitul: "50–500 zaměstnanců" },
  { value: "velka", label: "Velká", podtitul: "500+ zaměstnanců" },
  { value: "korporat", label: "Korporát", podtitul: "5000+ zaměstnanců" },
] as const;

export type TypSpoluprace = (typeof TYPY_SPOLUPRACE)[number]["value"];
export type Lokalita = (typeof LOKALITY)[number]["value"];
export type VelikostFirmy = (typeof VELIKOSTI_FIRMY)[number]["value"];
