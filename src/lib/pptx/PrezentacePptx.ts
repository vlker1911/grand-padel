// PPTX generator pro prezentace partnerům.
// Imperativní API pptxgenjs (žádné JSX). Slide-by-slide build.
// Layout 16:9 widescreen (13.333" × 7.5").

import PptxGenJS from "pptxgenjs";
import type { PhotoSet, PrezentaceData } from "@/lib/pdf/PrezentacePdf";

const PAGE_W = 13.333;
const PAGE_H = 7.5;

// Brand barvy bez "#" (pptxgenjs požaduje hex bez prefixu).
// Finalizováno 2026-06-03 podle brand manuálu v1.1.119.
const COLOR_BORDO = "801928";          // Brand Red
const COLOR_BORDO_ACCENT = "801928";   // Brand Red (akcenty)
const COLOR_BORDO_DARK = "59111C";     // pro placeholders, hluboký bordó
const COLOR_CREAM = "F8F6F1";          // Slonová kost
const COLOR_WHITE = "FFFFFF";
const COLOR_BLACK = "0D0D0D";          // Měkká černá
const COLOR_MUTED = "6B7280";
const COLOR_BORDER = "E5E3DE";

// Brand fonty: Bandeja (nadpisy) + Mluvka (text).
// Pozn.: PPTX fontFace nese jen jméno fontu — PowerPoint na příjemci je musí mít
// instalované nebo použije fallback. Pro klienty bez Bandeji bude Arial fallback.
const FONT_HEADING = "Bandeja";
const FONT = "Mluvka"; // body default

type Args = {
  data: PrezentaceData;
  logoFullBase64?: string;
  monogramBase64?: string;
  wordmarkBase64?: string;
  photos: PhotoSet;
};

export type DelkaPptx = "full" | "2p" | "1p";

// A4 portrait pro krátké varianty
const PORTRAIT_W = 8.27;
const PORTRAIT_H = 11.69;

// Mapování slugů na lidsky čitelné labely
function typyLabel(typy: string[] | null | undefined): string {
  if (!Array.isArray(typy) || typy.length === 0) return "";
  return typy.map((t) => {
    if (t === "sponzoring") return "Sponzoring";
    if (t === "firemni_turnaj") return "Firemní turnaj / teambuilding";
    if (t === "pronajem_kurtu") return "Pronájem kurtu";
    if (t === "b2b_partner") return "B2B partner";
    return t;
  }).join(" · ");
}

export async function generujPptx(design: "A" | "B", delka: DelkaPptx, args: Args): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.title = `Návrh spolupráce — ${args.data.firma_nazev}`;
  pptx.author = "Grand Padel";
  pptx.subject = "B2B partnership proposal";

  if (delka === "1p" || delka === "2p") {
    pptx.defineLayout({ name: "GP_PORTRAIT", width: PORTRAIT_W, height: PORTRAIT_H });
    pptx.layout = "GP_PORTRAIT";
    if (design === "B") {
      sestavitDesignBKratky(pptx, args, delka);
    } else {
      // Design A short (zatím landscape — placeholder)
      pptx.layout = "LAYOUT_WIDE";
      sestavitDesignA(pptx, args);
    }
  } else {
    pptx.layout = "LAYOUT_WIDE";
    if (design === "A") sestavitDesignA(pptx, args);
    else sestavitDesignB(pptx, args);
  }

  const out = await pptx.write({ outputType: "nodebuffer" });
  return out as Buffer;
}

// ──────────────────────────────────────────────────────────
// Design B krátké varianty (portrait A4) — strip + lajny + skutečné PNG logo
// ──────────────────────────────────────────────────────────
const STRIP_W_IN = 1.0;        // levý strip 1"
const LINE_W = 0.025;          // čára cca 2pt = 0.025"
const MARGIN = 0.4;            // okraje main

function shellPortraitB(
  pptx: PptxGenJS,
  data: PrezentaceData,
  monogramBase64: string | undefined,
  metaLeft?: string,
  tagline?: string,
): PptxGenJS.Slide {
  const s = pptx.addSlide();
  s.background = { color: COLOR_BORDO };

  // GP monogram (skutečné průhledné PNG) v levém stripu nahoře
  if (monogramBase64) {
    s.addImage({
      data: monogramBase64,
      x: 0.2, y: 0.25, w: 0.6, h: 0.36,
    });
  }
  // Vertikální čára (pravý okraj stripu)
  s.addShape("rect" as never, {
    x: STRIP_W_IN, y: 0, w: LINE_W, h: PORTRAIT_H,
    fill: { color: COLOR_WHITE }, line: { color: COLOR_WHITE, width: 0 },
  });
  // Horizontální čára dole
  s.addShape("rect" as never, {
    x: 0, y: PORTRAIT_H - 0.4, w: PORTRAIT_W, h: LINE_W,
    fill: { color: COLOR_WHITE }, line: { color: COLOR_WHITE, width: 0 },
  });

  if (metaLeft) {
    s.addText(metaLeft, {
      x: STRIP_W_IN + 0.3, y: PORTRAIT_H - 0.3, w: 7, h: 0.2,
      color: COLOR_WHITE, fontSize: 8, fontFace: FONT, transparency: 40,
    });
  }
  if (tagline) {
    s.addText(tagline, {
      x: STRIP_W_IN + 0.2, y: PORTRAIT_H - 0.28, w: PORTRAIT_W - STRIP_W_IN - 0.4, h: 0.22,
      color: COLOR_WHITE, fontSize: 11, fontFace: FONT, align: "center", bold: true,
    });
  }
  return s;
}

function wordmarkOnPage(
  s: PptxGenJS.Slide,
  wordmarkBase64: string | undefined,
  yPos: number,
  size: "big" | "small",
) {
  if (!wordmarkBase64) return;
  const w = size === "big" ? 3.0 : 1.8;
  const h = size === "big" ? 1.7 : 1.0;
  const x = STRIP_W_IN + (PORTRAIT_W - STRIP_W_IN - w) / 2;
  s.addImage({ data: wordmarkBase64, x, y: yPos, w, h });
}

// Vrátí Y-pozici PRVNÍHO řádku DALŠÍ sekce (yStart + suma výšek bulletů).
function bulletsBPortrait(s: PptxGenJS.Slide, items: string[], yStart: number, mark: "—" | "num"): number {
  // Konzervativní výška bullet — 0.75" pojme 3 řádky při fontSize 11
  const lineH = 0.75;
  items.forEach((item, i) => {
    const y = yStart + i * lineH;
    const m = mark === "num" ? `${i + 1}.` : "—";
    s.addText(m, {
      x: STRIP_W_IN + MARGIN, y, w: 0.35, h: 0.4,
      color: COLOR_CREAM, fontSize: 12, fontFace: FONT, bold: true,
    });
    s.addText(item, {
      x: STRIP_W_IN + MARGIN + 0.4, y, w: PORTRAIT_W - STRIP_W_IN - MARGIN - 0.5, h: lineH - 0.05,
      color: COLOR_WHITE, fontSize: 11, fontFace: FONT, transparency: 8,
      valign: "top",
    });
  });
  return yStart + items.length * lineH;
}

function sestavitDesignBKratky(pptx: PptxGenJS, args: Args, delka: "1p" | "2p") {
  const { data, monogramBase64, wordmarkBase64, photos } = args;
  const o = data.generovany_obsah;
  const datum = formatDatum(data.created_at);
  const typy = typyLabel(data.typy_spoluprace);

  if (delka === "1p") {
    const s = shellPortraitB(
      pptx, data, monogramBase64,
      undefined,
      `${data.firma_nazev} & Grand Padel — spolupráce, která dává smysl.`,
    );

    // Big wordmark centrovaný nahoře
    wordmarkOnPage(s, wordmarkBase64, 0.6, "big");

    // Firma BIG
    s.addText(data.firma_nazev, {
      x: STRIP_W_IN + MARGIN, y: 2.6, w: PORTRAIT_W - STRIP_W_IN - MARGIN * 2, h: 0.9,
      color: COLOR_WHITE, fontSize: 36, fontFace: FONT, bold: true,
    });
    if (typy) {
      s.addText(typy, {
        x: STRIP_W_IN + MARGIN, y: 3.55, w: PORTRAIT_W - STRIP_W_IN - MARGIN * 2, h: 0.3,
        color: COLOR_CREAM, fontSize: 11, fontFace: FONT, transparency: 10,
      });
    }
    // Divider
    s.addShape("rect" as never, {
      x: STRIP_W_IN + MARGIN, y: 3.95, w: 0.7, h: 0.04,
      fill: { color: COLOR_WHITE }, line: { color: COLOR_WHITE, width: 0 },
    });

    // Hodnota eyebrow + 3 bullets
    s.addText("PROČ GRAND PADEL", {
      x: STRIP_W_IN + MARGIN, y: 4.15, w: 6, h: 0.25,
      color: COLOR_CREAM, fontSize: 9, fontFace: FONT, bold: true, charSpacing: 3,
    });
    const hodnotaEnd = bulletsBPortrait(s, (o?.hodnota ?? []).slice(0, 3), 4.5, "—");

    // CTA hned pod hodnotami
    const ctaY = hodnotaEnd + 0.15;
    if (o?.call_to_action) {
      s.addShape("rect" as never, {
        x: STRIP_W_IN + MARGIN - 0.05, y: ctaY, w: 0.04, h: 0.8,
        fill: { color: COLOR_CREAM }, line: { color: COLOR_CREAM, width: 0 },
      });
      s.addText("DALŠÍ KROK", {
        x: STRIP_W_IN + MARGIN + 0.1, y: ctaY, w: 6, h: 0.2,
        color: COLOR_CREAM, fontSize: 9, fontFace: FONT, bold: true, charSpacing: 2,
      });
      s.addText(o.call_to_action, {
        x: STRIP_W_IN + MARGIN + 0.1, y: ctaY + 0.2, w: PORTRAIT_W - STRIP_W_IN - MARGIN * 2 - 0.2, h: 0.6,
        color: COLOR_WHITE, fontSize: 11, fontFace: FONT, valign: "top",
      });
    }

    // Nabídka + Kontakt vedle sebe
    const footerY = ctaY + 1.05;
    const colW = (PORTRAIT_W - STRIP_W_IN - MARGIN * 2 - 0.3) / 2;
    s.addText("NABÍDKA", {
      x: STRIP_W_IN + MARGIN, y: footerY, w: colW, h: 0.2,
      color: COLOR_CREAM, fontSize: 9, fontFace: FONT, bold: true, charSpacing: 2,
    });
    s.addText("Konkrétní nabídku zpracujeme po úvodním setkání podle vašich cílů a rozpočtu.", {
      x: STRIP_W_IN + MARGIN, y: footerY + 0.2, w: colW, h: 0.8,
      color: COLOR_WHITE, fontSize: 10, fontFace: FONT, transparency: 10, valign: "top",
    });
    s.addText("KONTAKT", {
      x: STRIP_W_IN + MARGIN + colW + 0.3, y: footerY, w: colW, h: 0.2,
      color: COLOR_CREAM, fontSize: 9, fontFace: FONT, bold: true, charSpacing: 2,
    });
    s.addText([
      { text: "Roman Vlk\n", options: { fontFace: FONT, fontSize: 11, color: COLOR_WHITE, bold: true } },
      { text: "info@grandpadel.cz\n", options: { fontFace: FONT, fontSize: 10, color: COLOR_WHITE } },
      { text: "grandpadel.cz", options: { fontFace: FONT, fontSize: 10, color: COLOR_WHITE } },
    ], { x: STRIP_W_IN + MARGIN + colW + 0.3, y: footerY + 0.2, w: colW, h: 0.8 });

    // 2 fotky na konci
    const fotoW = (PORTRAIT_W - STRIP_W_IN - MARGIN * 2 - 0.15) / 2;
    const fotoH = 2.0;
    const fotoY = PORTRAIT_H - 0.5 - fotoH - 0.3;
    if (photos.hero) s.addImage({ data: photos.hero, x: STRIP_W_IN + MARGIN, y: fotoY, w: fotoW, h: fotoH, sizing: { type: "cover", w: fotoW, h: fotoH } });
    if (photos.teambuilding) s.addImage({ data: photos.teambuilding, x: STRIP_W_IN + MARGIN + fotoW + 0.15, y: fotoY, w: fotoW, h: fotoH, sizing: { type: "cover", w: fotoW, h: fotoH } });
  } else {
    // 2p — Stránka 1: BIG wordmark + firma + hodnota
    const s1 = shellPortraitB(
      pptx, data, monogramBase64,
      `NÁVRH SPOLUPRÁCE · ${datum} · 1/2`,
    );
    wordmarkOnPage(s1, wordmarkBase64, 0.6, "big");
    s1.addText(data.firma_nazev, {
      x: STRIP_W_IN + MARGIN, y: 2.6, w: PORTRAIT_W - STRIP_W_IN - MARGIN * 2, h: 0.9,
      color: COLOR_WHITE, fontSize: 36, fontFace: FONT, bold: true,
    });
    if (typy) {
      s1.addText(typy, {
        x: STRIP_W_IN + MARGIN, y: 3.55, w: PORTRAIT_W - STRIP_W_IN - MARGIN * 2, h: 0.3,
        color: COLOR_CREAM, fontSize: 11, fontFace: FONT, transparency: 10,
      });
    }
    s1.addShape("rect" as never, {
      x: STRIP_W_IN + MARGIN, y: 3.95, w: 0.7, h: 0.04,
      fill: { color: COLOR_WHITE }, line: { color: COLOR_WHITE, width: 0 },
    });
    s1.addText("PROČ GRAND PADEL JAKO PARTNER", {
      x: STRIP_W_IN + MARGIN, y: 4.2, w: 6, h: 0.25,
      color: COLOR_CREAM, fontSize: 9, fontFace: FONT, bold: true, charSpacing: 3,
    });
    bulletsBPortrait(s1, (o?.hodnota ?? []).slice(0, 4), 4.55, "—");

    // Stránka 2 — návrhy + CTA + kontakt + fotky NA KONEC + tagline
    const s2 = shellPortraitB(
      pptx, data, monogramBase64,
      undefined,
      `${data.firma_nazev} & Grand Padel — spolupráce, která dává smysl.`,
    );
    wordmarkOnPage(s2, wordmarkBase64, 0.45, "small");
    s2.addText("KONKRÉTNÍ NÁVRHY", {
      x: STRIP_W_IN + MARGIN, y: 1.8, w: 6, h: 0.25,
      color: COLOR_CREAM, fontSize: 9, fontFace: FONT, bold: true, charSpacing: 3,
    });
    s2.addText("Co můžeme spolu udělat", {
      x: STRIP_W_IN + MARGIN, y: 2.1, w: PORTRAIT_W - STRIP_W_IN - MARGIN * 2, h: 0.7,
      color: COLOR_WHITE, fontSize: 22, fontFace: FONT, bold: true,
    });
    s2.addShape("rect" as never, {
      x: STRIP_W_IN + MARGIN, y: 2.85, w: 0.7, h: 0.04,
      fill: { color: COLOR_WHITE }, line: { color: COLOR_WHITE, width: 0 },
    });
    const navrhyEnd = bulletsBPortrait(s2, (o?.konkretni_navrhy ?? []).slice(0, 4), 3.1, "num");

    // CTA hned pod návrhy
    const ctaY = navrhyEnd + 0.15;
    if (o?.call_to_action) {
      s2.addShape("rect" as never, {
        x: STRIP_W_IN + MARGIN - 0.05, y: ctaY, w: 0.04, h: 0.8,
        fill: { color: COLOR_CREAM }, line: { color: COLOR_CREAM, width: 0 },
      });
      s2.addText("DALŠÍ KROK", {
        x: STRIP_W_IN + MARGIN + 0.1, y: ctaY, w: 6, h: 0.2,
        color: COLOR_CREAM, fontSize: 9, fontFace: FONT, bold: true, charSpacing: 2,
      });
      s2.addText(o.call_to_action, {
        x: STRIP_W_IN + MARGIN + 0.1, y: ctaY + 0.2, w: PORTRAIT_W - STRIP_W_IN - MARGIN * 2 - 0.2, h: 0.6,
        color: COLOR_WHITE, fontSize: 11, fontFace: FONT, valign: "top",
      });
    }

    const footerY = ctaY + 1.05;
    const colW = (PORTRAIT_W - STRIP_W_IN - MARGIN * 2 - 0.3) / 2;
    s2.addText("NABÍDKA", {
      x: STRIP_W_IN + MARGIN, y: footerY, w: colW, h: 0.2,
      color: COLOR_CREAM, fontSize: 9, fontFace: FONT, bold: true, charSpacing: 2,
    });
    s2.addText("Konkrétní nabídku zpracujeme po úvodním setkání.", {
      x: STRIP_W_IN + MARGIN, y: footerY + 0.2, w: colW, h: 0.7,
      color: COLOR_WHITE, fontSize: 10, fontFace: FONT, transparency: 10, valign: "top",
    });
    s2.addText("KONTAKT", {
      x: STRIP_W_IN + MARGIN + colW + 0.3, y: footerY, w: colW, h: 0.2,
      color: COLOR_CREAM, fontSize: 9, fontFace: FONT, bold: true, charSpacing: 2,
    });
    s2.addText([
      { text: "Roman Vlk\n", options: { fontFace: FONT, fontSize: 11, color: COLOR_WHITE, bold: true } },
      { text: "info@grandpadel.cz\n", options: { fontFace: FONT, fontSize: 10, color: COLOR_WHITE } },
      { text: "grandpadel.cz", options: { fontFace: FONT, fontSize: 10, color: COLOR_WHITE } },
    ], { x: STRIP_W_IN + MARGIN + colW + 0.3, y: footerY + 0.2, w: colW, h: 0.9 });

    // 2 fotky NA KONCI
    const fotoW = (PORTRAIT_W - STRIP_W_IN - MARGIN * 2 - 0.15) / 2;
    const fotoH = Math.max(1.6, PORTRAIT_H - 0.5 - 0.3 - (footerY + 1.2));
    const fotoY = PORTRAIT_H - 0.5 - fotoH - 0.3;
    if (photos.hero) s2.addImage({ data: photos.hero, x: STRIP_W_IN + MARGIN, y: fotoY, w: fotoW, h: fotoH, sizing: { type: "cover", w: fotoW, h: fotoH } });
    if (photos.teambuilding) s2.addImage({ data: photos.teambuilding, x: STRIP_W_IN + MARGIN + fotoW + 0.15, y: fotoY, w: fotoW, h: fotoH, sizing: { type: "cover", w: fotoW, h: fotoH } });
  }
}

// ──────────────────────────────────────────────────────────
// DESIGN A — bílé pages, bordó akcenty, fotky v kartách
// ──────────────────────────────────────────────────────────
function sestavitDesignA(pptx: PptxGenJS, { data, logoFullBase64, photos }: Args) {
  const o = data.generovany_obsah;
  const datum = formatDatum(data.created_at);
  const titulCen = data.bez_cen ? "Individuální nabídka" : "Cenové balíčky";

  // 1. COVER
  {
    const s = pptx.addSlide();
    s.background = { color: COLOR_BORDO };
    if (logoFullBase64) {
      s.addImage({ data: logoFullBase64, x: 0.55, y: 0.45, w: 1.5, h: 0.6 });
    }
    s.addText("NÁVRH SPOLUPRÁCE", {
      x: 0.6, y: 4.2, w: 6, h: 0.4,
      color: COLOR_WHITE, fontSize: 11, fontFace: FONT, bold: true, charSpacing: 5,
    });
    s.addText(data.firma_nazev, {
      x: 0.6, y: 4.6, w: 12, h: 1.5,
      color: COLOR_WHITE, fontSize: 60, fontFace: FONT, bold: true,
    });
    s.addText("Padel na nejvyšší úrovni", {
      x: 0.6, y: 5.9, w: 8, h: 0.5,
      color: COLOR_WHITE, fontSize: 22, fontFace: FONT, transparency: 15,
    });
    s.addText(`Grand Padel · ${datum}`, {
      x: 0.6, y: 6.9, w: 6, h: 0.3,
      color: COLOR_WHITE, fontSize: 10, fontFace: FONT, transparency: 40,
    });
  }

  // 2. O NÁS
  {
    const s = pptx.addSlide();
    s.background = { color: COLOR_WHITE };
    eyebrowA(s, "O NÁS");
    s.addText("Síť indoor padel center\nv České republice", {
      x: 0.6, y: 0.95, w: 11, h: 1.5,
      color: COLOR_BLACK, fontSize: 32, fontFace: FONT, bold: true, lineSpacingMultiple: 1.1,
    });
    courtLine(s, pptx, COLOR_BORDO_ACCENT);
    s.addText(
      "Stavíme síť moderních indoor padel center s vlajkovým CENTER kurtem v každé hale. Pre-launch — první hala se otevírá na podzim 2026.",
      { x: 0.6, y: 3.0, w: 7.5, h: 1.5, color: COLOR_BLACK, fontSize: 14, fontFace: FONT },
    );
    s.addText(
      "Padel je nejrychleji rostoucí raketový sport v Evropě. V České republice tvoříme od základu prémiovou ligu, klubové prostředí a komunitu hráčů a partnerů.",
      { x: 0.6, y: 4.4, w: 7.5, h: 1.5, color: COLOR_BLACK, fontSize: 14, fontFace: FONT },
    );
    // Statistiky vpravo
    statA(s, 9.0, 3.0, "3", "centra v plánu (2026–2027)");
    statA(s, 9.0, 4.1, "CENTER", "vlajkový kurt v každé hale");
    statA(s, 9.0, 5.2, "2026", "otevření Olomouce");
    pageFootA(s, data.firma_nazev, 2);
  }

  // 3. NAŠE CENTRA
  {
    const s = pptx.addSlide();
    s.background = { color: COLOR_CREAM };
    eyebrowA(s, "LOKALITY");
    s.addText("Naše centra", {
      x: 0.6, y: 0.95, w: 11, h: 0.8,
      color: COLOR_BLACK, fontSize: 32, fontFace: FONT, bold: true,
    });
    courtLine(s, pptx, COLOR_BORDO_ACCENT);
    const cardW = 4.0;
    const cardH = 4.5;
    const gap = 0.25;
    const startX = (PAGE_W - 3 * cardW - 2 * gap) / 2;
    centerCardA(s, startX, 2.5, cardW, cardH, "Olomouc", "otevření říjen 2026",
      "První centrum, srdce sítě. Strategická poloha mezi Brnem a Ostravou.", photos.hero);
    centerCardA(s, startX + cardW + gap, 2.5, cardW, cardH, "Ostrava", "otevření prosinec 2026",
      "Pokrytí severní Moravy a Slezska. Spádově hala pro celý region.", photos.akce);
    centerCardA(s, startX + 2 * (cardW + gap), 2.5, cardW, cardH, "Praha Zličín", "únor–březen 2027",
      "Vlajkové centrum v největším padel trhu ČR. Snadná dostupnost.", photos.center);
    pageFootA(s, data.firma_nazev, 3);
  }

  // 4. HODNOTA
  {
    const s = pptx.addSlide();
    s.background = { color: COLOR_WHITE };
    eyebrowA(s, "HODNOTA");
    s.addText("Proč Grand Padel\njako partner", {
      x: 0.6, y: 0.95, w: 11, h: 1.5,
      color: COLOR_BLACK, fontSize: 32, fontFace: FONT, bold: true, lineSpacingMultiple: 1.1,
    });
    courtLine(s, pptx, COLOR_BORDO_ACCENT);
    bulletsA(s, o.hodnota, 3.0, "▸");
    pageFootA(s, data.firma_nazev, 4);
  }

  // 5. NÁVRHY
  {
    const s = pptx.addSlide();
    s.background = { color: COLOR_WHITE };
    eyebrowA(s, "NÁVRHY");
    s.addText("Konkrétní možnosti spolupráce", {
      x: 0.6, y: 0.95, w: 11, h: 0.8,
      color: COLOR_BLACK, fontSize: 28, fontFace: FONT, bold: true,
    });
    courtLine(s, pptx, COLOR_BORDO_ACCENT);
    bulletsA(s, o.konkretni_navrhy, 2.5, "num");
    pageFootA(s, data.firma_nazev, 5);
  }

  // 6. CENOVÉ BALÍČKY
  {
    const s = pptx.addSlide();
    s.background = { color: COLOR_CREAM };
    eyebrowA(s, "NABÍDKA");
    s.addText(titulCen, {
      x: 0.6, y: 0.95, w: 11, h: 0.8,
      color: COLOR_BLACK, fontSize: 32, fontFace: FONT, bold: true,
    });
    courtLine(s, pptx, COLOR_BORDO_ACCENT);
    if (data.bez_cen || o.cenove_balicky.length === 0) {
      s.addText(
        "Konkrétní nabídku zpracujeme po úvodním setkání — přizpůsobíme ji vašim cílům, rozpočtu a očekávané viditelnosti partnerství.",
        { x: 0.6, y: 3.5, w: 9, h: 2, color: COLOR_MUTED, fontSize: 20, fontFace: FONT, italic: true },
      );
    } else {
      const n = o.cenove_balicky.length;
      const cardW = Math.min(3.7, (PAGE_W - 0.6 - 0.6 - (n - 1) * 0.25) / n);
      const startX = (PAGE_W - n * cardW - (n - 1) * 0.25) / 2;
      o.cenove_balicky.forEach((b, i) => {
        balicekCardA(s, startX + i * (cardW + 0.25), 2.7, cardW, 4.0, b);
      });
    }
    pageFootA(s, data.firma_nazev, 6);
  }

  // 7. TITLE SPONSORSHIP
  {
    const s = pptx.addSlide();
    s.background = { color: COLOR_WHITE };
    eyebrowA(s, "VAŠE TITLE SPONSORSHIP EXPERIENCE");
    s.addText(`${data.firma_nazev}\nna CENTER kurtu`, {
      x: 0.6, y: 0.95, w: 11, h: 1.5,
      color: COLOR_BLACK, fontSize: 30, fontFace: FONT, bold: true, lineSpacingMultiple: 1.1,
    });
    courtLine(s, pptx, COLOR_BORDO_ACCENT);
    const photoH = 2.0;
    const photoW = 5.7;
    const gap = 0.3;
    const startX = (PAGE_W - 2 * photoW - gap) / 2;
    photoOrPlaceholder(s, photos.center, startX, 2.7, photoW, photoH);
    photoOrPlaceholder(s, photos.centerVstup, startX + photoW + gap, 2.7, photoW, photoH);
    photoOrPlaceholder(s, photos.akce, startX, 2.7 + photoH + gap, photoW, photoH);
    photoOrPlaceholder(s, photos.teambuilding, startX + photoW + gap, 2.7 + photoH + gap, photoW, photoH);
    pageFootA(s, data.firma_nazev, 7);
  }

  // 8. CTA
  {
    const s = pptx.addSlide();
    s.background = { color: COLOR_WHITE };
    eyebrowA(s, "DALŠÍ KROK");
    s.addText("Pojďme se sejít", {
      x: 0.6, y: 0.95, w: 11, h: 0.8,
      color: COLOR_BLACK, fontSize: 32, fontFace: FONT, bold: true,
    });
    courtLine(s, pptx, COLOR_BORDO_ACCENT);
    s.addShape("rect" as never, {
      x: 0.6, y: 2.7, w: 12.13, h: 1.5,
      fill: { color: COLOR_WHITE },
      line: { color: COLOR_BORDER, width: 1 },
    });
    s.addText(o.call_to_action, {
      x: 0.9, y: 2.85, w: 11.5, h: 1.2,
      color: COLOR_BLACK, fontSize: 16, fontFace: FONT,
    });
    s.addText("KONTAKT", {
      x: 0.6, y: 4.6, w: 5, h: 0.3,
      color: COLOR_MUTED, fontSize: 10, fontFace: FONT, bold: true, charSpacing: 4,
    });
    s.addText([
      { text: "Roman Vlk — Grand Padel\n", options: { fontFace: FONT, fontSize: 14, color: COLOR_BLACK, bold: true } },
      { text: "info@grandpadel.cz\n", options: { fontFace: FONT, fontSize: 14, color: COLOR_BLACK } },
      { text: "grandpadel.cz", options: { fontFace: FONT, fontSize: 14, color: COLOR_BLACK } },
    ], { x: 0.6, y: 4.95, w: 8, h: 1.5 });
    if (o.dodatecne_info) {
      s.addText(o.dodatecne_info, {
        x: 0.6, y: 6.4, w: 12, h: 0.5,
        color: COLOR_MUTED, fontSize: 10, fontFace: FONT, italic: true,
      });
    }
    pageFootA(s, data.firma_nazev, 8);
  }

  // 9. DĚKUJEME
  {
    const s = pptx.addSlide();
    s.background = { color: COLOR_BORDO };
    s.addText("Děkujeme.", {
      x: 0.6, y: 2.3, w: 11, h: 2,
      color: COLOR_WHITE, fontSize: 90, fontFace: FONT, bold: true,
    });
    s.addText(`${data.firma_nazev} & Grand Padel — spolupráce, která dává smysl.`, {
      x: 0.6, y: 5.0, w: 11, h: 0.6,
      color: COLOR_WHITE, fontSize: 20, fontFace: FONT, transparency: 15,
    });
    s.addText("grandpadel.cz", {
      x: 0.6, y: 6.9, w: 5, h: 0.3,
      color: COLOR_WHITE, fontSize: 10, fontFace: FONT, transparency: 50,
    });
  }
}

// ──────────────────────────────────────────────────────────
// DESIGN B — bordó-dominantní, big typography, photo overlay
// ──────────────────────────────────────────────────────────
function sestavitDesignB(pptx: PptxGenJS, { data, monogramBase64, photos }: Args) {
  const o = data.generovany_obsah;
  const datum = formatDatum(data.created_at);
  const titulCen = data.bez_cen ? "Individuální nabídka" : "Cenové balíčky";

  // Společný shell — bordó bg + levý strip s monogramem + vertikální + horizontální čáry
  function shellB(cislo: number, opts?: { hidePageMeta?: boolean }): PptxGenJS.Slide {
    const s = pptx.addSlide();
    s.background = { color: COLOR_BORDO };
    if (monogramBase64) {
      s.addImage({ data: monogramBase64, x: 0.4, y: 0.4, w: 0.7, h: 0.7 });
    }
    // Vertikální bílá čára (oddělující strip)
    s.addShape("line" as never, {
      x: 1.5, y: 0.3, w: 0, h: PAGE_H - 0.6,
      line: { color: COLOR_WHITE, width: 0.75 },
    });
    // Horizontální spodní čára
    s.addShape("line" as never, {
      x: 0, y: PAGE_H - 0.4, w: PAGE_W, h: 0,
      line: { color: COLOR_WHITE, width: 0.5, transparency: 40 },
    });
    if (!opts?.hidePageMeta) {
      s.addText(`Grand Padel · Návrh pro ${data.firma_nazev}`, {
        x: 1.7, y: PAGE_H - 0.3, w: 8, h: 0.25,
        color: COLOR_WHITE, fontSize: 9, fontFace: FONT, transparency: 50,
      });
    }
    s.addText(String(cislo), {
      x: PAGE_W - 0.8, y: PAGE_H - 0.3, w: 0.4, h: 0.25,
      color: COLOR_WHITE, fontSize: 9, fontFace: FONT, transparency: 50, align: "right",
    });
    return s;
  }

  // 1. COVER
  {
    const s = shellB(1, { hidePageMeta: true });
    s.addText("NÁVRH SPOLUPRÁCE", {
      x: 1.8, y: 4.4, w: 8, h: 0.4,
      color: COLOR_CREAM, fontSize: 11, fontFace: FONT, bold: true, charSpacing: 5,
    });
    s.addText(data.firma_nazev, {
      x: 1.8, y: 4.8, w: 11, h: 1.6,
      color: COLOR_WHITE, fontSize: 80, fontFace: FONT, bold: true,
    });
    s.addText("Padel na nejvyšší úrovni", {
      x: 1.8, y: 6.3, w: 8, h: 0.4,
      color: COLOR_WHITE, fontSize: 20, fontFace: FONT, transparency: 15,
    });
    s.addText(`Grand Padel · ${datum}`, {
      x: 1.8, y: 6.7, w: 6, h: 0.3,
      color: COLOR_WHITE, fontSize: 10, fontFace: FONT, transparency: 40,
    });
  }

  // 2. O NÁS
  {
    const s = shellB(2);
    eyebrowB(s, "O NÁS");
    s.addText("Síť indoor padel center\nv České republice", {
      x: 1.8, y: 1.6, w: 11, h: 1.6,
      color: COLOR_WHITE, fontSize: 46, fontFace: FONT, bold: true, lineSpacingMultiple: 1.05,
    });
    s.addText(
      "Stavíme síť moderních indoor padel center s vlajkovým CENTER kurtem v každé hale. Pre-launch — první hala se otevírá na podzim 2026. Padel je nejrychleji rostoucí raketový sport v Evropě.",
      { x: 1.8, y: 3.5, w: 10, h: 1.5, color: COLOR_WHITE, fontSize: 14, fontFace: FONT, transparency: 10 },
    );
    statB(s, 1.8, 5.3, "3", "centra v plánu (2026–2027)");
    statB(s, 4.8, 5.3, "CENTER", "vlajkový kurt v každé hale");
    statB(s, 8.5, 5.3, "2026", "otevření Olomouce");
  }

  // 3. NAŠE CENTRA
  {
    const s = shellB(3);
    eyebrowB(s, "LOKALITY");
    s.addText("Naše centra", {
      x: 1.8, y: 1.5, w: 11, h: 0.8,
      color: COLOR_WHITE, fontSize: 36, fontFace: FONT, bold: true,
    });
    let y = 2.9;
    [
      { nazev: "Olomouc", kdy: "otevření říjen 2026", popis: "První centrum, srdce sítě. Strategická poloha mezi Brnem a Ostravou." },
      { nazev: "Ostrava", kdy: "otevření prosinec 2026", popis: "Pokrytí severní Moravy a Slezska. Spádově hala pro celý region." },
      { nazev: "Praha Zličín", kdy: "únor–březen 2027", popis: "Vlajkové centrum v největším padel trhu ČR. Snadná dostupnost." },
    ].forEach((c) => {
      s.addText(c.nazev, {
        x: 1.8, y, w: 3.5, h: 0.5,
        color: COLOR_WHITE, fontSize: 20, fontFace: FONT, bold: true,
      });
      s.addText(c.kdy, {
        x: 5.5, y, w: 2.8, h: 0.5,
        color: COLOR_CREAM, fontSize: 12, fontFace: FONT,
      });
      s.addText(c.popis, {
        x: 8.5, y, w: 4.3, h: 0.7,
        color: COLOR_WHITE, fontSize: 11, fontFace: FONT, transparency: 15,
      });
      // Tenká čára pod
      s.addShape("line" as never, {
        x: 1.8, y: y + 0.8, w: PAGE_W - 2.4, h: 0,
        line: { color: COLOR_WHITE, width: 0.5, transparency: 50 },
      });
      y += 1.0;
    });
  }

  // 4. HODNOTA
  {
    const s = shellB(4);
    eyebrowB(s, "HODNOTA");
    s.addText("Proč Grand Padel\njako partner", {
      x: 1.8, y: 1.5, w: 11, h: 1.5,
      color: COLOR_WHITE, fontSize: 36, fontFace: FONT, bold: true, lineSpacingMultiple: 1.1,
    });
    bulletsB(s, o.hodnota, 3.5, "—");
  }

  // 5. NÁVRHY
  {
    const s = shellB(5);
    eyebrowB(s, "NÁVRHY");
    s.addText("Konkrétní možnosti spolupráce", {
      x: 1.8, y: 1.5, w: 11, h: 0.8,
      color: COLOR_WHITE, fontSize: 30, fontFace: FONT, bold: true,
    });
    bulletsB(s, o.konkretni_navrhy, 2.8, "num");
  }

  // 6. CENOVÉ BALÍČKY
  {
    const s = shellB(6);
    eyebrowB(s, "NABÍDKA");
    s.addText(titulCen, {
      x: 1.8, y: 1.5, w: 11, h: 0.8,
      color: COLOR_WHITE, fontSize: 36, fontFace: FONT, bold: true,
    });
    if (data.bez_cen || o.cenove_balicky.length === 0) {
      s.addText(
        "Konkrétní nabídku zpracujeme po úvodním setkání — přizpůsobíme ji vašim cílům, rozpočtu a očekávané viditelnosti partnerství.",
        { x: 1.8, y: 3.5, w: 10, h: 2, color: COLOR_WHITE, fontSize: 18, fontFace: FONT, transparency: 15 },
      );
    } else {
      const n = o.cenove_balicky.length;
      const cardW = Math.min(3.5, (PAGE_W - 1.8 - 0.6 - (n - 1) * 0.25) / n);
      o.cenove_balicky.forEach((b, i) => {
        balicekCardB(s, pptx, 1.8 + i * (cardW + 0.25), 2.8, cardW, 3.7, b);
      });
    }
  }

  // 7. TITLE SPONSORSHIP — split: bordó text vlevo + čistá fotka centerVstup vpravo
  {
    const s = shellB(7);
    eyebrowB(s, "VAŠE TITLE SPONSORSHIP EXPERIENCE");
    s.addText(`${data.firma_nazev}\nna CENTER kurtu`, {
      x: 1.8, y: 1.8, w: 6.0, h: 2.0,
      color: COLOR_WHITE, fontSize: 36, fontFace: FONT, bold: true, lineSpacingMultiple: 1.05,
    });
    s.addText(
      "Vlajkový prémiový kurt v brandu vaší značky. Naming rights, viditelnost v každém zápase, dominantní pozice v hale.",
      { x: 1.8, y: 4.0, w: 6.0, h: 2.0, color: COLOR_WHITE, fontSize: 13, fontFace: FONT, transparency: 10 },
    );
    const foto = photos.centerVstup || photos.center;
    if (foto) {
      s.addImage({
        data: foto, x: 8.2, y: 1.5, w: 4.6, h: 4.5,
        sizing: { type: "cover", w: 4.6, h: 4.5 },
      });
    }
  }

  // 8. GALERIE — 3 čisté fotky vedle sebe
  {
    const s = shellB(8);
    eyebrowB(s, "ATMOSFÉRA");
    s.addText("Hala, kde se chce být", {
      x: 1.8, y: 1.5, w: 11, h: 0.8,
      color: COLOR_WHITE, fontSize: 30, fontFace: FONT, bold: true,
    });
    const fotky: { src: string | undefined; popis: string }[] = [
      { src: photos.akce, popis: "Hra v plné akci" },
      { src: photos.teambuilding, popis: "Firemní teambuildingy" },
      { src: photos.hero, popis: "Prémiová hala" },
    ];
    const fotkaW = 3.5;
    const fotkaH = 3.5;
    const gap = 0.25;
    const startX = 1.8;
    fotky.forEach((f, i) => {
      const x = startX + i * (fotkaW + gap);
      if (f.src) {
        s.addImage({ data: f.src, x, y: 2.8, w: fotkaW, h: fotkaH, sizing: { type: "cover", w: fotkaW, h: fotkaH } });
      } else {
        s.addShape("rect" as never, {
          x, y: 2.8, w: fotkaW, h: fotkaH,
          fill: { color: COLOR_BORDO_DARK },
          line: { color: COLOR_BORDO_DARK, width: 0 },
        });
      }
      s.addText(f.popis, {
        x, y: 2.8 + fotkaH + 0.05, w: fotkaW, h: 0.3,
        color: COLOR_CREAM, fontSize: 10, fontFace: FONT, transparency: 15,
      });
    });
  }

  // 9. CTA
  {
    const s = shellB(9);
    eyebrowB(s, "DALŠÍ KROK");
    s.addText("Pojďme se sejít", {
      x: 1.8, y: 1.5, w: 11, h: 1.0,
      color: COLOR_WHITE, fontSize: 46, fontFace: FONT, bold: true,
    });
    // CTA blok s levým bordó indikátorem
    s.addShape("rect" as never, {
      x: 1.8, y: 3.0, w: 0.04, h: 1.6,
      fill: { color: COLOR_CREAM },
      line: { color: COLOR_CREAM, width: 0 },
    });
    s.addText(o.call_to_action, {
      x: 2.0, y: 3.0, w: 10.5, h: 1.6,
      color: COLOR_WHITE, fontSize: 16, fontFace: FONT, transparency: 5,
    });
    s.addText("KONTAKT", {
      x: 1.8, y: 4.9, w: 5, h: 0.3,
      color: COLOR_CREAM, fontSize: 10, fontFace: FONT, bold: true, charSpacing: 4,
    });
    s.addText([
      { text: "Roman Vlk — Grand Padel\n", options: { fontFace: FONT, fontSize: 14, color: COLOR_WHITE, bold: true } },
      { text: "info@grandpadel.cz\n", options: { fontFace: FONT, fontSize: 14, color: COLOR_WHITE } },
      { text: "grandpadel.cz", options: { fontFace: FONT, fontSize: 14, color: COLOR_WHITE } },
    ], { x: 1.8, y: 5.25, w: 8, h: 1.5 });
  }

  // 10. DĚKUJEME
  {
    const s = shellB(10, { hidePageMeta: true });
    s.addText("Děkujeme.", {
      x: 1.8, y: 1.6, w: 11, h: 3,
      color: COLOR_WHITE, fontSize: 130, fontFace: FONT, bold: true,
    });
    s.addText(`${data.firma_nazev} & Grand Padel — spolupráce, která dává smysl.`, {
      x: 1.8, y: 5.7, w: 11, h: 0.7,
      color: COLOR_WHITE, fontSize: 22, fontFace: FONT, transparency: 10,
    });
  }
}

// ──────────────────────────────────────────────────────────
// Helpers — Design A
// ──────────────────────────────────────────────────────────
function eyebrowA(s: PptxGenJS.Slide, text: string) {
  s.addText(text, {
    x: 0.6, y: 0.55, w: 8, h: 0.3,
    color: COLOR_BORDO_ACCENT, fontSize: 10, fontFace: FONT, bold: true, charSpacing: 4,
  });
}

function courtLine(s: PptxGenJS.Slide, pptx: PptxGenJS, color: string) {
  s.addShape("rect" as never, {
    x: 0.6, y: 2.55, w: 0.9, h: 0.04,
    fill: { color },
    line: { color, width: 0 },
  });
}

function pageFootA(s: PptxGenJS.Slide, firma: string, cislo: number) {
  s.addText(`Grand Padel · Návrh pro ${firma}`, {
    x: 0.6, y: PAGE_H - 0.35, w: 7, h: 0.25,
    color: COLOR_MUTED, fontSize: 9, fontFace: FONT,
  });
  s.addText(String(cislo), {
    x: PAGE_W - 0.8, y: PAGE_H - 0.35, w: 0.4, h: 0.25,
    color: COLOR_MUTED, fontSize: 9, fontFace: FONT, align: "right",
  });
}

function statA(s: PptxGenJS.Slide, x: number, y: number, cislo: string, popis: string) {
  s.addText(cislo, {
    x, y, w: 3.5, h: 0.6,
    color: COLOR_BORDO_ACCENT, fontSize: 32, fontFace: FONT, bold: true,
  });
  s.addText(popis, {
    x, y: y + 0.55, w: 3.5, h: 0.3,
    color: COLOR_MUTED, fontSize: 10, fontFace: FONT,
  });
}

function centerCardA(
  s: PptxGenJS.Slide,
  x: number, y: number, w: number, h: number,
  nazev: string, kdy: string, popis: string, foto: string | undefined,
) {
  // Backround karty
  // (Card border via background + invisible offset)
  // Foto nahoře
  if (foto) {
    s.addImage({ data: foto, x, y, w, h: 2.0, sizing: { type: "cover", w, h: 2.0 } });
  }
  // Bílá karta pro spodní část s textem
  // PPTX nemá rounded corners shape s text — používám simple rectangles.
  // Background pod text:
  // Text:
  s.addText(nazev, {
    x: x + 0.15, y: y + 2.15, w: w - 0.3, h: 0.4,
    color: COLOR_BORDO_ACCENT, fontSize: 16, fontFace: FONT, bold: true,
  });
  s.addText(kdy, {
    x: x + 0.15, y: y + 2.55, w: w - 0.3, h: 0.3,
    color: COLOR_MUTED, fontSize: 10, fontFace: FONT,
  });
  s.addText(popis, {
    x: x + 0.15, y: y + 2.9, w: w - 0.3, h: 1.2,
    color: COLOR_BLACK, fontSize: 11, fontFace: FONT,
  });
}

function bulletsA(s: PptxGenJS.Slide, items: string[], yStart: number, marker: "▸" | "num") {
  const lineH = Math.min(0.7, 4.0 / Math.max(items.length, 1));
  items.forEach((item, i) => {
    const y = yStart + i * lineH;
    const m = marker === "num" ? `${i + 1}.` : "▸";
    s.addText(m, {
      x: 0.6, y, w: 0.4, h: lineH - 0.05,
      color: COLOR_BORDO_ACCENT, fontSize: 12, fontFace: FONT, bold: true,
    });
    s.addText(item, {
      x: 1.0, y, w: 11.5, h: lineH - 0.05,
      color: COLOR_BLACK, fontSize: 12, fontFace: FONT,
    });
  });
}

function balicekCardA(
  s: PptxGenJS.Slide,
  x: number, y: number, w: number, h: number,
  b: { nazev: string; popis: string; cena_min: number; cena_max: number; vhodne_pro: string },
) {
  // Border
  s.addShape("rect" as never, {
    x, y, w, h,
    fill: { color: COLOR_WHITE },
    line: { color: COLOR_BORDER, width: 1 },
  });
  s.addText(b.nazev, {
    x: x + 0.15, y: y + 0.15, w: w - 0.3, h: 0.4,
    color: COLOR_BORDO_ACCENT, fontSize: 14, fontFace: FONT, bold: true,
  });
  s.addText(b.popis, {
    x: x + 0.15, y: y + 0.6, w: w - 0.3, h: 2.0,
    color: COLOR_BLACK, fontSize: 10, fontFace: FONT,
  });
  s.addText(`${b.cena_min.toLocaleString("cs-CZ")} – ${b.cena_max.toLocaleString("cs-CZ")} Kč`, {
    x: x + 0.15, y: y + h - 0.85, w: w - 0.3, h: 0.4,
    color: COLOR_BLACK, fontSize: 13, fontFace: FONT, bold: true,
  });
  s.addText(`Vhodné pro: ${b.vhodne_pro}`, {
    x: x + 0.15, y: y + h - 0.4, w: w - 0.3, h: 0.3,
    color: COLOR_MUTED, fontSize: 9, fontFace: FONT,
  });
}

function photoOrPlaceholder(
  s: PptxGenJS.Slide,
  foto: string | undefined,
  x: number, y: number, w: number, h: number,
) {
  if (foto) {
    s.addImage({ data: foto, x, y, w, h, sizing: { type: "cover", w, h } });
  } else {
    s.addShape("rect" as never, {
      x, y, w, h,
      fill: { color: COLOR_BORDER },
      line: { color: COLOR_BORDER, width: 0 },
    });
  }
}

// ──────────────────────────────────────────────────────────
// Helpers — Design B
// ──────────────────────────────────────────────────────────
function eyebrowB(s: PptxGenJS.Slide, text: string) {
  s.addText(text, {
    x: 1.8, y: 1.0, w: 11, h: 0.3,
    color: COLOR_CREAM, fontSize: 10, fontFace: FONT, bold: true, charSpacing: 5,
  });
}

function statB(s: PptxGenJS.Slide, x: number, y: number, cislo: string, popis: string) {
  s.addText(cislo, {
    x, y, w: 3.5, h: 0.7,
    color: COLOR_CREAM, fontSize: 36, fontFace: FONT, bold: true,
  });
  s.addText(popis, {
    x, y: y + 0.65, w: 3.0, h: 0.4,
    color: COLOR_WHITE, fontSize: 10, fontFace: FONT, transparency: 15,
  });
}

function bulletsB(s: PptxGenJS.Slide, items: string[], yStart: number, marker: "—" | "num") {
  const lineH = Math.min(0.65, 3.5 / Math.max(items.length, 1));
  items.forEach((item, i) => {
    const y = yStart + i * lineH;
    const m = marker === "num" ? `${i + 1}.` : "—";
    s.addText(m, {
      x: 1.8, y, w: 0.5, h: lineH - 0.05,
      color: COLOR_CREAM, fontSize: 13, fontFace: FONT, bold: true,
    });
    s.addText(item, {
      x: 2.4, y, w: 10.5, h: lineH - 0.05,
      color: COLOR_WHITE, fontSize: 13, fontFace: FONT, transparency: 10,
    });
  });
}

function balicekCardB(
  s: PptxGenJS.Slide,
  pptx: PptxGenJS,
  x: number, y: number, w: number, h: number,
  b: { nazev: string; popis: string; cena_min: number; cena_max: number; vhodne_pro: string },
) {
  s.addShape("rect" as never, {
    x, y, w, h,
    fill: { color: COLOR_BORDO },
    line: { color: COLOR_WHITE, width: 1 },
  });
  s.addText(b.nazev, {
    x: x + 0.15, y: y + 0.15, w: w - 0.3, h: 0.4,
    color: COLOR_CREAM, fontSize: 13, fontFace: FONT, bold: true,
  });
  s.addText(b.popis, {
    x: x + 0.15, y: y + 0.6, w: w - 0.3, h: 1.9,
    color: COLOR_WHITE, fontSize: 10, fontFace: FONT, transparency: 15,
  });
  s.addText(`${b.cena_min.toLocaleString("cs-CZ")} – ${b.cena_max.toLocaleString("cs-CZ")} Kč`, {
    x: x + 0.15, y: y + h - 0.85, w: w - 0.3, h: 0.4,
    color: COLOR_WHITE, fontSize: 13, fontFace: FONT, bold: true,
  });
  s.addText(`Vhodné pro: ${b.vhodne_pro}`, {
    x: x + 0.15, y: y + h - 0.4, w: w - 0.3, h: 0.3,
    color: COLOR_WHITE, fontSize: 9, fontFace: FONT, transparency: 30,
  });
}

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
