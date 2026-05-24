// PPTX generator pro prezentace partnerům.
// Imperativní API pptxgenjs (žádné JSX). Slide-by-slide build.
// Layout 16:9 widescreen (13.333" × 7.5").

import PptxGenJS from "pptxgenjs";
import type { PhotoSet, PrezentaceData } from "@/lib/pdf/PrezentacePdf";

const PAGE_W = 13.333;
const PAGE_H = 7.5;

// Brand barvy bez "#" (pptxgenjs požaduje hex bez prefixu)
const COLOR_BORDO = "801A28"; // sjednoceno s logem
const COLOR_BORDO_ACCENT = "8C1325"; // web reality
const COLOR_CREAM = "F2EDE4";
const COLOR_WHITE = "FFFFFF";
const COLOR_BLACK = "0A0A0A";
const COLOR_MUTED = "6B7280";
const COLOR_BORDER = "E5E3DE";

const FONT = "Poppins";

type Args = {
  data: PrezentaceData;
  logoFullBase64?: string;
  monogramBase64?: string;
  photos: PhotoSet;
};

export async function generujPptx(design: "A" | "B", args: Args): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.333 × 7.5
  pptx.title = `Návrh spolupráce — ${args.data.firma_nazev}`;
  pptx.author = "Grand Padel";
  pptx.subject = "B2B partnership proposal";

  if (design === "A") {
    sestavitDesignA(pptx, args);
  } else {
    sestavitDesignB(pptx, args);
  }

  const out = await pptx.write({ outputType: "nodebuffer" });
  return out as Buffer;
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
    s.addShape(pptx.shapes.RECTANGLE, {
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
    s.addShape(pptx.shapes.LINE, {
      x: 1.5, y: 0.3, w: 0, h: PAGE_H - 0.6,
      line: { color: COLOR_WHITE, width: 0.75 },
    });
    // Horizontální spodní čára
    s.addShape(pptx.shapes.LINE, {
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
      s.addShape(pptx.shapes.LINE, {
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
        s.addShape(pptx.shapes.RECTANGLE, {
          x, y: 2.8, w: fotkaW, h: fotkaH,
          fill: { color: "5F0C19" },
          line: { color: "5F0C19", width: 0 },
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
    s.addShape(pptx.shapes.RECTANGLE, {
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
  s.addShape(pptx.shapes.RECTANGLE, {
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
  s.addShape(pptx.shapes.RECTANGLE, {
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
