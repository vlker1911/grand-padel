// Grand Padel brand tokeny — JEDEN zdroj pro kód.
// Hodnoty pocházejí z vizual/barvy/paleta.md a vizual/typografie/fonty.md.
// Když se brand změní, mění se POUZE tento soubor.
//
// Finalizováno 2026-06-03 podle oficiálního brand manuálu brand.grandpadel.cz v1.1.119.

export const brand = {
  colors: {
    // Hlavní paleta z manuálu
    red:    "#801928",   // Červená — primární brand color
    ivory:  "#F8F6F1",   // Slonová kost — krémová alternativa k bílé
    white:  "#FFFFFF",   // Bílá
    black:  "#0D0D0D",   // Měkká černá — text a tmavá pozadí

    // UI tonal scale pro červenou (manuál "Rozšířená paleta" zatím nedodán — placeholder)
    redHover:  "#6A1521",
    redActive: "#59111C",

    // UI utility (ne brand) — světlejší pozadí, jemné okraje, neutrální gray
    zincLight:  "#F5F4F1",
    zincBorder: "#E5E3DE",
    muted:      "#6b7280",

    // Alias pro backward compat — staré `cream` (#F2EDE4) je nahrazeno `ivory` (#F8F6F1)
    cream: "#F8F6F1",
  },
  fonts: {
    // Brand fonty (Fungi Type, custom pro Grand Padel) — self-host v public/fonts/
    headline:    "Bandeja, Arial, system-ui, sans-serif",
    body:        "Mluvka, Arial, system-ui, sans-serif",
    logoDisplay: "Bandeja, Arial, system-ui, sans-serif",
  },
  logo: {
    // Finální SVG s průhledným pozadím (manual-final-2026-05-23/logo/).
    // Použít přednostně SVG; PNG jen kde SVG nelze (MS Office, e-mail).
    fullSvg:     "/logos/grand-padel-red.svg",
    monogramSvg: "/logos/gp-red.svg",
    fullPng:     "/logos/grand-padel-red.png",
    monogramPng: "/logos/gp-red.png",
    // Bílé varianty pro tmavá pozadí
    fullWhiteSvg:     "/logos/grand-padel-white.svg",
    monogramWhiteSvg: "/logos/gp-white.svg",
    fullWhitePng:     "/logos/grand-padel-white.png",
    monogramWhitePng: "/logos/gp-white.png",
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

// Aktivní brand design webu — varianta A (čistá, světlá) nebo B (bordó-dominantní).
// Přepíná se z /admin/design, uloženo v public.web_settings.
export type BrandDesign = "A" | "B";
