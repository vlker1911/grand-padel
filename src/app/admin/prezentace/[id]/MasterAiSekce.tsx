"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { brand } from "@/lib/brand";

type Props = {
  prezentaceId: string;
  firmaNazev: string;
};

export default function MasterAiSekce({ prezentaceId, firmaNazev }: Props) {
  const router = useRouter();
  const [jsonText, setJsonText] = useState("");
  const [stav, setStav] = useState<"idle" | "uklada" | "ok" | "chyba">("idle");
  const [zprava, setZprava] = useState<string | null>(null);
  const [zkopirovano, setZkopirovano] = useState(false);

  const prompt = useMemo(() => sestavitMasterPrompt(firmaNazev), [firmaNazev]);

  async function kopirovat() {
    try {
      await navigator.clipboard.writeText(prompt);
      setZkopirovano(true);
      setTimeout(() => setZkopirovano(false), 2000);
    } catch {
      setZprava("Kopírování selhalo — označ a zkopíruj text ručně.");
    }
  }

  async function nacistAUlozit() {
    setStav("uklada");
    setZprava(null);
    try {
      const cleaned = vyrizniJson(jsonText);
      const parsed = JSON.parse(cleaned);

      // Normalizace dat — flexibilní akcept různých variant od AI
      const meta = parsed.meta ?? parsed.metadata ?? parsed;
      const obsah = parsed.obsah ?? parsed.content ?? parsed;

      const body = {
        meta: {
          typySpoluprace: Array.isArray(meta.typySpoluprace) ? meta.typySpoluprace : Array.isArray(meta.typy_spoluprace) ? meta.typy_spoluprace : undefined,
          lokalita: meta.lokalita,
          velikostFirmy: meta.velikostFirmy ?? meta.velikost_firmy,
          firmaBarva: meta.firmaBarva ?? meta.firma_barva,
          firmaBarvaSekundarni: meta.firmaBarvaSekundarni ?? meta.firma_barva_sekundarni,
          dodatecneInfo: meta.dodatecneInfo ?? meta.dodatecne_info,
        },
        obsah: obsah && (obsah.uvod || obsah.hodnota) ? {
          uvod: String(obsah.uvod ?? ""),
          hodnota: Array.isArray(obsah.hodnota) ? obsah.hodnota.map(String) : [],
          konkretni_navrhy: Array.isArray(obsah.konkretni_navrhy) ? obsah.konkretni_navrhy.map(String) : [],
          cenove_balicky: [],
          call_to_action: String(obsah.call_to_action ?? ""),
          dodatecne_info: String(obsah.dodatecne_info ?? ""),
        } : undefined,
      };

      const r = await fetch(`/api/admin/prezentace/${prezentaceId}/aktualizovat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.chyba ?? "Aktualizace selhala");
      setStav("ok");
      setZprava("✓ Uloženo. Aktualizuji stránku…");
      router.refresh();
      setTimeout(() => { setStav("idle"); setZprava(null); }, 2500);
    } catch (e) {
      setStav("chyba");
      setZprava(e instanceof Error ? e.message : "Načtení JSON selhalo");
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: brand.colors.muted }}>
        Doplnit obsah přes AI
      </h2>
      <p className="text-sm mb-5" style={{ color: brand.colors.muted }}>
        Zkopíruj prompt do <strong>Claude.ai</strong>, vlož výslednou JSON odpověď zpět a klikni „Načíst a uložit". Vyplní se lokalita, velikost firmy, brand barva i obsah (úvod, hodnota, návrhy, CTA).
      </p>

      {/* Box 1: Prompt */}
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: brand.colors.black }}>
          1. Prompt pro Claude.ai
        </div>
        <textarea
          value={prompt}
          readOnly
          rows={8}
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs font-mono bg-zinc-50"
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={kopirovat}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: brand.colors.red }}
          >
            {zkopirovano ? "✓ Zkopírováno" : "Kopírovat prompt"}
          </button>
          <a
            href="https://claude.ai/new"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium hover:underline"
            style={{ color: brand.colors.red }}
          >
            Otevřít Claude.ai →
          </a>
        </div>
      </div>

      {/* Box 2: Odpověď */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: brand.colors.black }}>
          2. Vlož JSON odpověď
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={6}
          placeholder='{"meta": {...}, "obsah": {...}}'
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs font-mono"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={nacistAUlozit}
            disabled={stav === "uklada" || jsonText.trim() === ""}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: brand.colors.red }}
          >
            {stav === "uklada" ? "Ukládám…" : "Načíst a uložit ↓"}
          </button>
          {zprava && (
            <span className="text-xs" style={{ color: stav === "ok" ? "#16a34a" : brand.colors.red }}>
              {zprava}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
function sestavitMasterPrompt(firma: string): string {
  return `Jsi expert na B2B prodej a content marketing pro Grand Padel — síť indoor padel center otevírající se v České republice v roce 2026.

# O Grand Padelu
- Síť moderních indoor padel center
- Otevření: Olomouc (říjen 2026), Ostrava (prosinec 2026), Praha Zličín (únor–březen 2027)
- Každá hala má vlajkový CENTER kurt
- Pre-launch fáze — prezentace komunikuje vizi a budoucnost
- Padel = nejrychleji rostoucí raketový sport v Evropě

# Vibe značky
Tmavý dramatický prémium. Sebevědomý, vážný, klubový. Konkrétní, věcný, žádné laciné fráze ("synergie", "win-win").

# Zadání
Pro firmu "${firma}" navrhni KOMPLETNÍ obsah B2B prezentace. Pokud znáš firmu z veřejných zdrojů, využij to (velikost, branže, geografie, brand barvy z loga).

# Výstup — POUZE JSON, žádný okolní text, žádný markdown fence

{
  "meta": {
    "typySpoluprace": ["sponzoring"],
    "lokalita": "cela_cr",
    "velikostFirmy": "korporat",
    "firmaBarva": "tmavě zelená #00A862",
    "firmaBarvaSekundarni": "",
    "dodatecneInfo": ""
  },
  "obsah": {
    "uvod": "2–3 věty osobního oslovení firmy",
    "hodnota": ["3–5 bodů proč Grand Padel jako partner — konkrétně"],
    "konkretni_navrhy": ["3–5 specifických návrhů spolupráce"],
    "cenove_balicky": [],
    "call_to_action": "1–2 věty — návrh dalšího kroku (schůzka, prohlídka)",
    "dodatecne_info": "1–2 věty poznámka (otevírací termín, pre-launch výhody)"
  }
}

# Hodnoty enums (uvádět pouze jednu z přípustných hodnot)

- typySpoluprace: kombinace z "sponzoring", "firemni_turnaj", "pronajem_kurtu", "b2b_partner"
- lokalita: "olomouc" | "ostrava" | "praha_zlicin" | "cela_cr"
- velikostFirmy: "mala" (do 50) | "stredni" (50–500) | "velka" (500+) | "korporat" (5000+)

# Pravidla
- Češky, bez emoji, profesionální tón
- firmaBarva: primární brand barva partnera (žlutá pro Rohlík, modrá pro O2, oranžová pro Alza, atd.) — formát "název #HEX"
- cenove_balicky: VŽDY prázdné pole [] (krátké varianty prezentace jsou bez cen)
- Nepoužívej výplňové fráze. Buď konkrétní a hovořící.`;
}

function vyrizniJson(text: string): string {
  const t = text.trim();
  const fenced = t.match(/^\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`$/);
  if (fenced) return fenced[1].trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return t.slice(first, last + 1);
  }
  return t;
}
