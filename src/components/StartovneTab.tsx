"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import {
  validujCisloUctu, cisloUctuNaIBAN, vytvorSPAYD,
} from "@/lib/qr-platba";

type StartovneData = {
  castka?: number;
  mena?: string;
  iban?: string;
  prefix?: string;
  cislo?: string;
  banka?: string;
  vs?: string;
  zprava?: string;
  poznamka?: string;
};

type HraInput = {
  id: string;
  nazev: string;
  settings: { startovne?: StartovneData } & Record<string, unknown> | null;
};

export default function StartovneTab({ hra, jeEditor }: { hra: HraInput; jeEditor: boolean }) {
  const supabase = createClient();
  const s: StartovneData = ((hra.settings as { startovne?: StartovneData } | null)?.startovne) ?? {};

  const [castka,   setCastka]   = useState<number | "">(s.castka ?? "");
  const [prefix,   setPrefix]   = useState(s.prefix ?? "");
  const [cislo,    setCislo]    = useState(s.cislo ?? "");
  const [banka,    setBanka]    = useState(s.banka ?? "");
  const [vs,       setVs]       = useState(s.vs ?? "");
  const [zprava,   setZprava]   = useState(s.zprava ?? `Startovne ${hra.nazev}`.slice(0, 60));
  const [poznamka, setPoznamka] = useState(s.poznamka ?? "");
  const maUlozeneNastaveni = !!(s.cislo && s.banka);
  const [editovat, setEditovat] = useState(!maUlozeneNastaveni);
  const [ukladam,  setUkladam]  = useState(false);
  const [chyba,    setChyba]    = useState("");

  const validUcet = useMemo(() => validujCisloUctu(prefix, cislo, banka), [prefix, cislo, banka]);
  const iban = useMemo(() => {
    if (!validUcet) return "";
    return cisloUctuNaIBAN(prefix, cislo, banka);
  }, [prefix, cislo, banka, validUcet]);

  const spayd = useMemo(() => {
    if (!iban) return "";
    return vytvorSPAYD({
      iban,
      castka: typeof castka === "number" ? castka : null,
      vs: vs.trim() || undefined,
      zprava: zprava.trim() || undefined,
    });
  }, [iban, castka, vs, zprava]);

  async function uloz() {
    setUkladam(true);
    setChyba("");
    if (!validUcet) {
      setChyba("Neplatne cislo uctu — zkontroluj.");
      setUkladam(false);
      return;
    }
    const noveStartovne: StartovneData = {
      castka: typeof castka === "number" ? castka : undefined,
      mena: "CZK",
      iban,
      prefix, cislo, banka,
      vs: vs.trim() || undefined,
      zprava: zprava.trim() || undefined,
      poznamka: poznamka.trim() || undefined,
    };
    const noveSettings = { ...(hra.settings ?? {}), startovne: noveStartovne };
    const { error } = await supabase.from("hry").update({ settings: noveSettings }).eq("id", hra.id);
    if (error) {
      setChyba("Ulozeni selhalo: " + error.message);
      setUkladam(false);
      return;
    }
    setUkladam(false);
    setEditovat(false);
    window.location.reload();
  }

  const stahnoutPng = useRef<HTMLDivElement>(null);

  function downloadQR() {
    if (!stahnoutPng.current) return;
    const svg = stahnoutPng.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 600;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = png;
      a.download = `qr-platba-${hra.nazev}.png`;
      a.click();
    };
    img.src = url;
  }

  // Zobrazeni hracum (read-only): cislo uctu z DB. IBAN regenerujeme
  // z cisla uctu (drive se ukladal spatne — bug fix v0.9.1).
  const ulozenyIban = s.cislo && s.banka && validujCisloUctu(s.prefix ?? "", s.cislo, s.banka)
    ? cisloUctuNaIBAN(s.prefix ?? "", s.cislo, s.banka)
    : "";
  const ulozenyCisloUctuText = s.prefix || s.cislo || s.banka
    ? `${s.prefix ? s.prefix + "-" : ""}${s.cislo ?? ""}/${s.banka ?? ""}`
    : ulozenyIban;
  const ulozenySpayd = ulozenyIban ? vytvorSPAYD({
    iban: ulozenyIban,
    castka: s.castka ?? null,
    vs: s.vs,
    zprava: s.zprava,
  }) : "";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold mb-1" style={{ color: "#0A0A0A" }}>Startovné</h2>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          {editovat
            ? "Vyplň účet a částku. QR kód se vygeneruje automaticky."
            : "Naskenuj QR ve své bankovní appce — platba se předvyplní."}
        </p>
      </div>

      {!editovat && ulozenyIban && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex flex-col gap-4 items-center">
          <div ref={stahnoutPng} className="bg-white rounded-xl p-3">
            <QRCodeSVG value={ulozenySpayd} size={240} marginSize={2} />
          </div>
          <div className="text-center">
            {s.castka && (
              <p className="text-2xl font-bold" style={{ color: "#0A0A0A" }}>
                {s.castka.toLocaleString("cs-CZ")} Kč
              </p>
            )}
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
              {ulozenyCisloUctuText}
            </p>
            {s.vs && <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>VS: {s.vs}</p>}
            {s.zprava && <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>Zpráva: {s.zprava}</p>}
            {s.poznamka && (
              <p className="text-sm mt-3 italic" style={{ color: "#374151" }}>{s.poznamka}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={downloadQR}
              className="rounded-lg px-4 py-2 text-xs font-semibold border border-zinc-200 hover:bg-zinc-50"
              style={{ color: "#374151" }}>
              Stáhnout PNG
            </button>
            {jeEditor && (
              <button onClick={() => setEditovat(true)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: "#801A28" }}>
                Upravit
              </button>
            )}
          </div>
        </div>
      )}

      {!editovat && !ulozenyIban && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center">
          <p className="text-sm" style={{ color: "#6b7280" }}>Organizátor zatím nenastavil startovné.</p>
          {jeEditor && (
            <button onClick={() => setEditovat(true)}
              className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "#801A28" }}>
              Nastavit startovné
            </button>
          )}
        </div>
      )}

      {editovat && jeEditor && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Předčíslí <span style={{ color: "#9ca3af" }}>(volitelné)</span></label>
              <input type="text" value={prefix} maxLength={6} placeholder="123456"
                onChange={e => setPrefix(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Číslo účtu *</label>
              <input type="text" value={cislo} maxLength={10} placeholder="1234567890"
                onChange={e => setCislo(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Kód banky *</label>
              <input type="text" value={banka} maxLength={4} placeholder="0100"
                onChange={e => setBanka(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
            </div>
          </div>
          {!validUcet && (prefix || cislo || banka) && (
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              Čislo účtu zatím není platné. Formát: <code>předčíslí-číslo/banka</code> (např. 19-2000145399/0800).
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Částka (Kč)</label>
              <input type="number" min={0} step={1} value={castka}
                onChange={e => { const n = parseFloat(e.target.value); setCastka(isNaN(n) ? "" : n); }}
                placeholder="500"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Variabilní symbol</label>
              <input type="text" value={vs} maxLength={10} placeholder="1234"
                onChange={e => setVs(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Zpráva pro příjemce (max 60 znaků)</label>
            <input type="text" value={zprava} maxLength={60}
              onChange={e => setZprava(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#374151" }}>Poznámka pro hráče <span style={{ color: "#9ca3af" }}>(volitelné)</span></label>
            <textarea value={poznamka} rows={2}
              placeholder="Splatné do 18. 5. 2026. V hotovosti na místě možno taky."
              onChange={e => setPoznamka(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
          </div>

          {/* Nahled */}
          {validUcet && spayd && (
            <div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50">
              <p className="text-xs font-medium mb-2" style={{ color: "#6b7280" }}>Náhled QR</p>
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded shrink-0">
                  <QRCodeSVG value={spayd} size={120} marginSize={2} />
                </div>
                <div className="text-xs space-y-0.5" style={{ color: "#6b7280" }}>
                  <p>IBAN: <code>{iban}</code></p>
                  {typeof castka === "number" && castka > 0 && <p>Částka: <strong>{castka} Kč</strong></p>}
                  {vs && <p>VS: {vs}</p>}
                  {zprava && <p>Zpráva: {zprava}</p>}
                </div>
              </div>
            </div>
          )}

          {chyba && <p className="text-sm" style={{ color: "#801A28" }}>{chyba}</p>}

          <div className="flex gap-2 justify-end">
            {maUlozeneNastaveni && (
              <button onClick={() => setEditovat(false)} disabled={ukladam}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-zinc-200">
                Zrušit
              </button>
            )}
            <button onClick={uloz} disabled={ukladam || !validUcet}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: "#801A28" }}>
              {ukladam ? "Ukládám..." : "Uložit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
