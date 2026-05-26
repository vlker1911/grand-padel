"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { smazatHru as smazatHruDb, nactiPoctyMazani, type HraTyp } from "@/lib/hry";

type Hra = {
  id: string;
  nazev: string;
  typ: HraTyp;
  stav: "priprava" | "probiha" | "ukonceno";
  pocet_kurtu: number;
  body_na_zapas: number | null;
  created_by: string;
  created_at: string;
  settings: { zruseno?: boolean } | null;
};

const TYP_LABEL: Record<string, string> = {
  americano: "Americano",
  mexicano: "Mexicano",
  mixano: "Mixano",
  turnaj: "Turnaj",
};

const TYP_COLOR: Record<string, string> = {
  americano: "#8C1325",
  mexicano: "#b45309",
  mixano: "#6d28d9",
  turnaj: "#0f766e",
};

const STAV_LABEL: Record<string, string> = {
  priprava: "Příprava",
  probiha: "Probíhá",
  ukonceno: "Ukončeno",
};

type Filtr = "vse" | "aktivni" | "ukoncene" | "zrusene";

export default function HryPage() {
  const [hry, setHry] = useState<Hra[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [editorHry, setEditorHry] = useState<Set<string>>(new Set());
  const [smazatHra, setSmazatHra] = useState<Hra | null>(null);
  const [pocty, setPocty] = useState<{ pocetZapasu: number; pocetUcastniku: number } | null>(null);
  const [mazem, setMazem] = useState(false);
  const [potvrzeni, setPotvrzeni] = useState(false);
  const [filtr, setFiltr] = useState<Filtr>("aktivni");
  const supabase = createClient();

  async function nactiHry() {
    const [{ data: hryData }, { data: { user } }] = await Promise.all([
      supabase.from("hry").select("*").order("created_at", { ascending: false }),
      supabase.auth.getUser(),
    ]);
    setHry(hryData ?? []);
    setUserId(user?.id ?? null);
    if (user) {
      const { data: ed } = await supabase.from("hra_editatori").select("hra_id").eq("user_id", user.id);
      setEditorHry(new Set((ed ?? []).map((e: { hra_id: string }) => e.hra_id)));
    }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { nactiHry(); }, []);

  function jeEditor(hra: Hra): boolean {
    if (!userId) return false;
    return hra.created_by === userId || editorHry.has(hra.id);
  }

  function projdeFiltrem(hra: Hra): boolean {
    const zruseno = hra.settings?.zruseno === true;
    if (filtr === "vse") return true;
    if (filtr === "zrusene") return zruseno;
    if (filtr === "ukoncene") return !zruseno && hra.stav === "ukonceno";
    // aktivni
    return !zruseno && (hra.stav === "priprava" || hra.stav === "probiha");
  }

  const filtrovane = hry.filter(projdeFiltrem);
  const pocty_filtru: Record<Filtr, number> = {
    vse: hry.length,
    aktivni: hry.filter(h => !h.settings?.zruseno && (h.stav === "priprava" || h.stav === "probiha")).length,
    ukoncene: hry.filter(h => !h.settings?.zruseno && h.stav === "ukonceno").length,
    zrusene: hry.filter(h => h.settings?.zruseno).length,
  };

  async function otevriSmazat(hra: Hra, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSmazatHra(hra);
    setPocty(null);
    setPotvrzeni(false);
    const p = await nactiPoctyMazani(supabase, hra.id, hra.typ);
    setPocty(p);
  }

  async function provedSmazani() {
    if (!smazatHra) return;
    setMazem(true);
    const { error } = await smazatHruDb(supabase, smazatHra.id, smazatHra.typ);
    if (error) {
      alert(error);
      setMazem(false);
      return;
    }
    setHry(prev => prev.filter(h => h.id !== smazatHra.id));
    setMazem(false);
    setSmazatHra(null);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-12" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="max-w-4xl mx-auto">

          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#8C1325" }}>Herní centrum</h1>
              <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>Americano, Mexicano, Mixano, Turnaj</p>
            </div>
            <Link href="/hry/nova"
              className="rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#8C1325" }}>
              + Nová hra
            </Link>
          </div>

          {!loading && hry.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {([
                ["aktivni", "Aktivní"],
                ["ukoncene", "Ukončené"],
                ["zrusene", "Zrušené"],
                ["vse", "Vše"],
              ] as Array<[Filtr, string]>).map(([k, label]) => (
                <button key={k} onClick={() => setFiltr(k)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    filtr === k ? "text-white" : "bg-white border border-zinc-200 hover:bg-zinc-50"
                  }`}
                  style={filtr === k ? { backgroundColor: "#8C1325" } : { color: "#374151" }}>
                  {label} <span className={filtr === k ? "opacity-70" : "text-zinc-400"}>({pocty_filtru[k]})</span>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="text-center py-20 text-sm" style={{ color: "#9ca3af" }}>Načítám hry…</div>
          )}

          {!loading && hry.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg font-semibold mb-2" style={{ color: "#0A0A0A" }}>Zatím žádné hry</p>
              <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Vytvoř první hru a pozvi kamarády!</p>
              <Link href="/hry/nova"
                className="rounded-full px-6 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: "#8C1325" }}>
                Vytvoř první hru
              </Link>
            </div>
          )}

          {!loading && hry.length > 0 && filtrovane.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color: "#9ca3af" }}>
              V této kategorii nejsou žádné hry.
            </div>
          )}

          {!loading && filtrovane.length > 0 && (
            <div className="flex flex-col gap-4">
              {filtrovane.map((hra) => (
                <div key={hra.id} className="bg-white rounded-2xl border border-zinc-100 p-5 hover:shadow-md transition-shadow flex items-center justify-between gap-4">
                  <Link href={`/hry/${hra.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="rounded-xl px-3 py-1 text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: TYP_COLOR[hra.typ] }}>
                      {TYP_LABEL[hra.typ]}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: "#0A0A0A" }}>{hra.nazev}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                        {hra.pocet_kurtu} {hra.pocet_kurtu === 1 ? "kurt" : hra.pocet_kurtu < 5 ? "kurty" : "kurtů"}
                        {hra.body_na_zapas ? ` · ${hra.body_na_zapas} bodů` : ""}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      hra.settings?.zruseno ? "bg-red-50 text-red-700" :
                      hra.stav === "probiha" ? "bg-green-100 text-green-700" :
                      hra.stav === "ukonceno" ? "bg-zinc-100 text-zinc-500" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {hra.settings?.zruseno ? "Zrušeno" : STAV_LABEL[hra.stav]}
                    </span>
                    {jeEditor(hra) && (
                      <button onClick={(e) => otevriSmazat(hra, e)}
                        aria-label="Smazat hru"
                        title="Smazat hru"
                        className="rounded-lg p-2 hover:bg-red-50 transition-colors"
                        style={{ color: "#9ca3af" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {smazatHra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => !mazem && setSmazatHra(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#8C1325" }}>Trvale smazat hru?</h3>
            <p className="text-sm mb-3" style={{ color: "#6b7280" }}>
              Tato akce je <strong>nevratná</strong>. Smaže všechny zápasy, účastníky i nastavení hry.
            </p>
            <div className="rounded-lg bg-zinc-50 px-4 py-3 mb-4 text-sm" style={{ color: "#374151" }}>
              <p><strong>{smazatHra.nazev}</strong></p>
              {pocty ? (
                <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                  {pocty.pocetUcastniku} účastníků &middot; {pocty.pocetZapasu} zápasů
                </p>
              ) : (
                <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>Počítám záznamy…</p>
              )}
            </div>
            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={potvrzeni} onChange={e => setPotvrzeni(e.target.checked)}
                className="mt-0.5" />
              <span className="text-sm" style={{ color: "#374151" }}>
                Rozumím, že data nepůjdou obnovit.
              </span>
            </label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSmazatHra(null)} disabled={mazem}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-zinc-200 hover:bg-zinc-50"
                style={{ color: "#374151" }}>
                Ponechat
              </button>
              <button onClick={provedSmazani} disabled={mazem || !potvrzeni}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: "#8C1325" }}>
                {mazem ? "Mažu…" : "Ano, smazat trvale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
