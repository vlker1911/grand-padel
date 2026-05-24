"use client";

import { useRef, useState } from "react";
import { brand } from "@/lib/brand";
import { PHOTO_SLOTS, type PhotoSlot } from "@/lib/photo-prompts";

type Stav = "idle" | "uploaduje" | "ok" | "chyba";

type Props = {
  prezentaceId: string;
  firmaNazev: string;
  firmaBarva: string | null;
  firmaBarvaSekundarni: string | null;
};

export default function FotoSekce({ prezentaceId, firmaNazev, firmaBarva, firmaBarvaSekundarni }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: brand.colors.muted }}>
        Fotky pro PDF
      </h2>
      <p className="text-sm mb-6" style={{ color: brand.colors.muted }}>
        4 fotky jsou společné pro všechny prezentace (hero, akce, teambuilding, detail) —
        pokud jsou nahrané globálně, nepotřebuješ je zde znovu uploadovat.
        <br />
        <strong>CENTER kurt</strong> je per-prezentace (s logem partnera). Pro {firmaNazev} doporučujeme nahrát.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {PHOTO_SLOTS.map((s) => (
          <FotoKarta
            key={s.slot}
            prezentaceId={prezentaceId}
            slot={s.slot}
            firmaNazev={firmaNazev}
            firmaBarva={firmaBarva}
            firmaBarvaSekundarni={firmaBarvaSekundarni}
          />
        ))}
      </div>
    </div>
  );
}

function FotoKarta({
  prezentaceId,
  slot,
  firmaNazev,
  firmaBarva,
  firmaBarvaSekundarni,
}: {
  prezentaceId: string;
  slot: PhotoSlot;
  firmaNazev: string;
  firmaBarva: string | null;
  firmaBarvaSekundarni: string | null;
}) {
  const meta = PHOTO_SLOTS.find((p) => p.slot === slot)!;
  const [stav, setStav] = useState<Stav>("idle");
  const [chyba, setChyba] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [zobrazitPrompt, setZobrazitPrompt] = useState(false);
  const [kopirovano, setKopirovano] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const barvaText = firmaBarva?.trim() || "primární brand barva partnera (doplň HEX nebo název)";
  const barva2Text =
    firmaBarvaSekundarni?.trim() || firmaBarva?.trim() || "sekundární brand barva partnera (volitelně)";
  const promptText = meta.prompt
    .replace(/\{PARTNER\}/g, firmaNazev)
    .replace(/\{PARTNER_COLOR_2\}/g, barva2Text)
    .replace(/\{PARTNER_COLOR\}/g, barvaText);

  // Existence souboru ověřujeme přes <img> načtení (onError = neexistuje)
  const [imgOk, setImgOk] = useState<"jpg" | "png" | null>(null);

  async function kopirovatPrompt() {
    try {
      await navigator.clipboard.writeText(promptText);
      setKopirovano(true);
      setTimeout(() => setKopirovano(false), 2000);
    } catch {
      setChyba("Kopírování selhalo");
    }
  }

  async function nahrat(file: File) {
    setStav("uploaduje");
    setChyba(null);
    const fd = new FormData();
    fd.set("slot", slot);
    fd.set("file", file);
    try {
      const r = await fetch(`/api/admin/prezentace/${prezentaceId}/foto`, {
        method: "POST",
        body: fd,
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.chyba ?? "Nahrání selhalo");
      setStav("ok");
      setVersion((v) => v + 1);
      setImgOk(null); // znovu se ověří
      setTimeout(() => setStav("idle"), 2000);
    } catch (e) {
      setStav("chyba");
      setChyba(e instanceof Error ? e.message : "Nahrání selhalo");
    }
  }

  async function smazat() {
    if (!confirm("Smazat fotku pro tento slot?")) return;
    try {
      const r = await fetch(`/api/admin/prezentace/${prezentaceId}/foto?slot=${slot}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("Smazání selhalo");
      setVersion((v) => v + 1);
      setImgOk(null);
    } catch (e) {
      setChyba(e instanceof Error ? e.message : "Smazání selhalo");
    }
  }

  function onSubor(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) nahrat(f);
    e.target.value = "";
  }

  const jpgUrl = `/photos/prezentace/${prezentaceId}/${slot}.jpg?v=${version}`;
  const pngUrl = `/photos/prezentace/${prezentaceId}/${slot}.png?v=${version}`;

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: meta.perPrezentace ? brand.colors.red : "#E5E3DE", backgroundColor: meta.perPrezentace ? "#FBF1F2" : "#fafaf9" }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="text-sm font-semibold" style={{ color: brand.colors.black }}>
            {meta.label}
          </div>
          <div className="text-xs mt-0.5" style={{ color: brand.colors.muted }}>
            {meta.perPrezentace ? "Per-prezentace (zde)" : "Globální (volitelně přepsat)"}
          </div>
        </div>
        {imgOk && (
          <button
            type="button"
            onClick={smazat}
            className="text-xs hover:underline"
            style={{ color: brand.colors.red }}
          >
            Smazat
          </button>
        )}
      </div>

      {/* Náhled */}
      <div
        className="w-full rounded-lg overflow-hidden mb-3 flex items-center justify-center"
        style={{ aspectRatio: "16 / 9", backgroundColor: "#E5E3DE" }}
      >
        {/* Pokus o JPG */}
        {!imgOk && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={jpgUrl}
            alt=""
            className="hidden"
            onLoad={() => setImgOk("jpg")}
            onError={() => {
              // zkusíme PNG až poté
              const probe = new window.Image();
              probe.onload = () => setImgOk("png");
              probe.onerror = () => setImgOk(null);
              probe.src = pngUrl;
            }}
          />
        )}
        {imgOk === "jpg" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={jpgUrl} alt={meta.label} className="w-full h-full object-cover" />
        )}
        {imgOk === "png" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pngUrl} alt={meta.label} className="w-full h-full object-cover" />
        )}
        {imgOk === null && (
          <span className="text-xs" style={{ color: brand.colors.muted }}>
            Žádná per-prezentace fotka (použije se globální)
          </span>
        )}
      </div>

      {/* Akce */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={kopirovatPrompt}
          className="rounded-full px-4 py-1.5 text-xs font-semibold border-2"
          style={{ borderColor: brand.colors.red, color: brand.colors.red }}
        >
          {kopirovano ? "✓ Zkopírováno" : "Kopírovat prompt"}
        </button>
        <a
          href="https://gemini.google.com/app"
          target="_blank"
          rel="noreferrer"
          className="rounded-full px-4 py-1.5 text-xs font-semibold border border-zinc-200 hover:bg-zinc-50"
          style={{ color: brand.colors.black }}
        >
          Otevřít Gemini →
        </a>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={stav === "uploaduje"}
          className="rounded-full px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: brand.colors.red }}
        >
          {stav === "uploaduje" ? "Nahrávám…" : "Nahrát soubor"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={onSubor}
        />
        <button
          type="button"
          onClick={() => setZobrazitPrompt((x) => !x)}
          className="text-xs hover:underline ml-auto"
          style={{ color: brand.colors.muted }}
        >
          {zobrazitPrompt ? "Skrýt prompt" : "Zobrazit prompt"}
        </button>
      </div>

      {zobrazitPrompt && (
        <pre className="text-xs whitespace-pre-wrap font-mono rounded-lg p-3 mt-2 max-h-48 overflow-auto" style={{ backgroundColor: "#F5F4F1", color: brand.colors.black }}>
          {promptText}
        </pre>
      )}

      {stav === "ok" && (
        <p className="text-xs mt-2" style={{ color: "#16a34a" }}>✓ Nahráno</p>
      )}
      {chyba && (
        <p className="text-xs mt-2" style={{ color: brand.colors.red }}>{chyba}</p>
      )}
    </div>
  );
}
