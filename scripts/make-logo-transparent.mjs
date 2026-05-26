// One-shot skript: zpracuje logo PNG soubory v vizual/loga/ a vytvoří
// verze s průhledným pozadím. Vstupní bordó pixely (#801A28 a okolí)
// se nahradí transparentními — zůstane jen bílé logo.
//
// Spustit: node scripts/make-logo-transparent.mjs

import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const vizualLogaDir = path.resolve(projectRoot, "..", "vizual", "loga");
const outputDir = path.resolve(projectRoot, "public", "logos-transparent");

await mkdir(outputDir, { recursive: true });

const sources = [
  { src: "Grand Padel logo GP.png", out: "gp-monogram.png" },
  { src: "Grand Padel název logo.png", out: "gp-full.png" },
];

// Tolerance pro detekci bordó pixelu — bere v úvahu okolní hodnoty kvůli antialiasingu
function jeBordo(r, g, b) {
  // Cílová barva ~ #801A28 (128, 26, 40), s tolerancí
  const dr = Math.abs(r - 128);
  const dg = Math.abs(g - 26);
  const db = Math.abs(b - 40);
  return dr < 35 && dg < 35 && db < 35 && r > g && r > b;
}

for (const { src, out } of sources) {
  const inputPath = path.join(vizualLogaDir, src);
  const outputPath = path.join(outputDir, out);
  console.log(`Zpracovávám: ${src} → ${out}`);

  try {
    const inputBuf = await readFile(inputPath);
    const { data, info } = await sharp(inputBuf)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    const newData = Buffer.alloc(width * height * 4);

    let transparentni = 0;
    for (let i = 0; i < width * height; i++) {
      const r = data[i * channels];
      const g = data[i * channels + 1];
      const b = data[i * channels + 2];
      const a = channels === 4 ? data[i * channels + 3] : 255;

      newData[i * 4] = r;
      newData[i * 4 + 1] = g;
      newData[i * 4 + 2] = b;
      if (jeBordo(r, g, b)) {
        newData[i * 4 + 3] = 0;
        transparentni++;
      } else {
        newData[i * 4 + 3] = a;
      }
    }

    await sharp(newData, { raw: { width, height, channels: 4 } })
      .png()
      .toFile(outputPath);

    const procento = ((transparentni / (width * height)) * 100).toFixed(1);
    console.log(`  → ${width}×${height}, transparentních: ${procento}%`);
  } catch (e) {
    console.error(`  ❌ Chyba: ${e.message}`);
  }
}

console.log("\nHotovo. Soubory v:", outputDir);
