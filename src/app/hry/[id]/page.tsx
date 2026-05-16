"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { spocitejTabulku } from "@/lib/americano";

type Hra = {
  id: string;
  nazev: string;
  typ: string;
  stav: string;
  pocet_kurtu: number;
  body_na_zapas: number;
  created_by: string;
};

type Ucastnik = {
  id: string;
  jmeno: string;
  user_id: string | null;
};

type Zapas = {
  id: string;
  kolo: number;
  kurt: number;
  tym1_hrac1_id: string;
  tym1_hrac2_id: string;
  tym2_hrac1_id: string;
  tym2_hrac2_id: string;
  skore_tym1: number | null;
  skore_tym2: number | null;
  stav: string;
};

export default function HraDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [hra, setHra] = useState<Hra | null>(null);
  const [ucastnici, setUcastnici] = useState<Ucastnik[]>([]);
  const [zapasy, setZapasy] = useState<Zapas[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [jeEditor, setJeEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aktivniKolo, setAktivniKolo] = useState(1);
  const [editZapas, setEditZapas] = useState<string | null>(null);
  const [skore, setSkore] = useState<{ s1: string; s2: string }>({ s1: "", s2: "" });
  const [ukládám, setUkládám] = useState(false);

  const nactiData = useCallback(async () => {
    const [{ data: hraData }, { data: ucastData }, { data: zapasyData }, { data: { user } }] = await Promise.all([
      supabase.from("hry").select("*").eq("id", id).single(),
      supabase.from("hra_ucastnici").select("*").eq("hra_id", id),
      supabase.from("hra_zapasy").select("*").eq("hra_id", id).order("kolo").order("kurt"),
      supabase.auth.getUser(),
    ]);

    setHra(hraData);
    setUcastnici(ucastData ?? []);
    setZapasy(zapasyData ?? []);
    setUserId(user?.id ?? null);

    if (user && hraData) {
      const jeOrganizator = hraData.created_by === user.id;
      if (!jeOrganizator) {
        const { data: edData } = await supabase.from("hra_editatori").select("id").eq("hra_id", id).eq("user_id", user.id).single();
        setJeEditor(!!edData);
      } else {
        setJeEditor(true);
      }
    }

    setLoading(false);
  }, [id, supabase]);

  useEffect(() => { nactiData(); }, [nactiData]);

  function jmenoHrace(hracId: string) {
    return ucastnici.find((u) => u.id === hracId)?.jmeno ?? "?";
  }

  const kola = [...new Set(zapasy.map((z) => z.kolo))].sort((a, b) => a - b);
  const zapasyKola = zapasy.filter((z) => z.kolo === aktivniKolo);

  const tabulka = spocitejTabulku(
    ucastnici.map((u) => ({ id: u.id, jmeno: u.jmeno })),
    zapasy.map((z) => ({
      tym1: [z.tym1_hrac1_id, z.tym1_hrac2_id] as [string, string],
      tym2: [z.tym2_hrac1_id, z.tym2_hrac2_id] as [string, string],
      skore_tym1: z.skore_tym1,
      skore_tym2: z.skore_tym2,
    }))
  );

  function otevriEditaci(z: Zapas) {
    setEditZapas(z.id);
    setSkore({ s1: z.skore_tym1?.toString() ?? "", s2: z.skore_tym2?.toString() ?? "" });
  }

  async function ulozSkore() {
    if (!editZapas) return;
    setUkládám(true);
    const s1 = parseInt(skore.s1);
    const s2 = parseInt(skore.s2);
    if (isNaN(s1) || isNaN(s2)) { setUkládám(false); return; }

    await supabase.from("hra_zapasy").update({ skore_tym1: s1, skore_tym2: s2, stav: "ukonceno" }).eq("id", editZapas);
    setEditZapas(null);
    setUkládám(false);
    await nactiData();
  }

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#F2EDE4" }}>
        <p className="text-sm" style={{ color: "#9ca3af" }}>Načítám hru…</p>
      </main>
    </div>
  );

  if (!hra) return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#F2EDE4" }}>
        <p className="text-sm" style={{ color: "#9ca3af" }}>Hra nenalezena.</p>
      </main>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-10" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="max-w-3xl mx-auto">

          {/* Hlavička */}
          <div className="mb-8">
            <a href="/hry" className="text-sm hover:underline" style={{ color: "#801A28" }}>← Zpět na hry</a>
            <div className="flex items-start justify-between gap-4 mt-3">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#801A28" }}>{hra.nazev}</h1>
                <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                  {hra.typ.charAt(0).toUpperCase() + hra.typ.slice(1)} · {hra.pocet_kurtu} {hra.pocet_kurtu === 1 ? "kurt" : "kurty"} · {hra.body_na_zapas} bodů
                </p>
              </div>
              <span className={`text-xs font-medium px-3 py-1.5 rounded-full shrink-0 ${
                hra.stav === "probiha" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
              }`}>
                {hra.stav === "probiha" ? "🟢 Probíhá" : "Ukončeno"}
              </span>
            </div>
          </div>

          {/* Tabulka */}
          <section className="bg-white rounded-2xl border border-zinc-100 mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="font-semibold" style={{ color: "#0A0A0A" }}>Průběžná tabulka</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#fafafa" }}>
                  <th className="text-left px-5 py-2.5 font-medium text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>#</th>
                  <th className="text-left px-5 py-2.5 font-medium text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Hráč</th>
                  <th className="text-right px-5 py-2.5 font-medium text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Body</th>
                </tr>
              </thead>
              <tbody>
                {tabulka.map((h, i) => (
                  <tr key={h.id} className="border-t border-zinc-50">
                    <td className="px-5 py-3 font-bold text-sm w-8" style={{ color: i === 0 ? "#801A28" : "#9ca3af" }}>{i + 1}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: "#0A0A0A" }}>{h.jmeno}</td>
                    <td className="px-5 py-3 text-right font-bold" style={{ color: i === 0 ? "#801A28" : "#374151" }}>{h.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Rozpis kol */}
          <section className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="font-semibold" style={{ color: "#0A0A0A" }}>Zápasy</h2>
              <div className="flex gap-1">
                {kola.map((k) => (
                  <button key={k} onClick={() => setAktivniKolo(k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${aktivniKolo === k ? "text-white" : "text-zinc-500 hover:bg-zinc-100"}`}
                    style={{ backgroundColor: aktivniKolo === k ? "#801A28" : undefined }}>
                    Kolo {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-zinc-50">
              {zapasyKola.map((z) => (
                <div key={z.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-medium mb-2" style={{ color: "#9ca3af" }}>Kurt {z.kurt}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 text-right">
                          <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>{jmenoHrace(z.tym1_hrac1_id)}</p>
                          <p className="text-xs" style={{ color: "#6b7280" }}>{jmenoHrace(z.tym1_hrac2_id)}</p>
                        </div>
                        <div className="text-center shrink-0">
                          {z.skore_tym1 != null ? (
                            <span className="text-lg font-bold" style={{ color: "#0A0A0A" }}>{z.skore_tym1} : {z.skore_tym2}</span>
                          ) : (
                            <span className="text-sm font-medium" style={{ color: "#9ca3af" }}>vs</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>{jmenoHrace(z.tym2_hrac1_id)}</p>
                          <p className="text-xs" style={{ color: "#6b7280" }}>{jmenoHrace(z.tym2_hrac2_id)}</p>
                        </div>
                      </div>
                    </div>

                    {jeEditor && (
                      <button onClick={() => otevriEditaci(z)}
                        className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition-colors"
                        style={{ color: "#801A28" }}>
                        {z.skore_tym1 != null ? "Upravit" : "Zadat"}
                      </button>
                    )}
                  </div>

                  {/* Inline editace skóre */}
                  {editZapas === z.id && (
                    <div className="mt-4 flex items-center gap-3 justify-end">
                      <input type="number" min={0} max={99} value={skore.s1} onChange={(e) => setSkore({ ...skore, s1: e.target.value })}
                        className="w-16 rounded-lg border-2 border-[#801A28] px-2 py-2 text-center text-sm font-bold focus:outline-none"
                        placeholder="0" />
                      <span className="font-bold text-sm" style={{ color: "#9ca3af" }}>:</span>
                      <input type="number" min={0} max={99} value={skore.s2} onChange={(e) => setSkore({ ...skore, s2: e.target.value })}
                        className="w-16 rounded-lg border-2 border-[#801A28] px-2 py-2 text-center text-sm font-bold focus:outline-none"
                        placeholder="0" />
                      <button onClick={ulozSkore} disabled={ukládám}
                        className="rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                        style={{ backgroundColor: "#801A28" }}>
                        {ukládám ? "…" : "Uložit"}
                      </button>
                      <button onClick={() => setEditZapas(null)}
                        className="rounded-lg px-3 py-2 text-xs font-medium border border-zinc-200 hover:bg-zinc-50">
                        Zrušit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
