"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { generujAmericano } from "@/lib/americano";

type Typ = "americano" | "mexicano" | "turnaj";

const FORMATY = [
  { typ: "americano" as Typ, nazev: "Americano", popis: "Rotující páry, individuální skóre. Každý hraje s každým." },
  { typ: "mexicano" as Typ, nazev: "Mexicano", popis: "Hráči jsou přiřazeni na kurty a po každém kole se přesouvají podle výsledků." },
  { typ: "turnaj" as Typ, nazev: "Turnaj", popis: "Skupinová fáze pro páry/týmy. Volitelný playoff pavouk." },
];

type HracEntry = { jmeno: string; email: string };

export default function NovaHraPage() {
  const router = useRouter();
  const supabase = createClient();

  const [krok, setKrok] = useState<1 | 2 | 3>(1);
  const [typ, setTyp] = useState<Typ | null>(null);
  const [nazev, setNazev] = useState("");
  const [pocetKurtu, setPocetKurtu] = useState(2);
  const [pocetHracu, setPocetHracu] = useState(8);
  const [bodyNaZapas, setBodyNaZapas] = useState(24);
  const [hraci, setHraci] = useState<HracEntry[]>(
    Array.from({ length: 8 }, () => ({ jmeno: "", email: "" }))
  );
  const [stav, setStav] = useState<"idle" | "loading" | "chyba">("idle");
  const [chyba, setChyba] = useState("");

  function nastavPocetHracu(n: number) {
    setPocetHracu(n);
    setHraci((prev) => {
      if (n > prev.length) return [...prev, ...Array.from({ length: n - prev.length }, () => ({ jmeno: "", email: "" }))];
      return prev.slice(0, n);
    });
  }

  function pridejHrace() {
    setHraci([...hraci, { jmeno: "", email: "" }]);
    setPocetHracu(pocetHracu + 1);
  }

  function odeberHrace(i: number) {
    if (hraci.length <= 4) return;
    setHraci(hraci.filter((_, idx) => idx !== i));
    setPocetHracu(pocetHracu - 1);
  }

  function updateHrac(i: number, pole: keyof HracEntry, hodnota: string) {
    const novi = [...hraci];
    novi[i] = { ...novi[i], [pole]: hodnota };
    setHraci(novi);
  }

  async function vytvorHru() {
    if (!typ) return;
    setStav("loading");
    setChyba("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setChyba("Musíš být přihlášen."); setStav("chyba"); return; }

    const platniHraci = hraci.filter((h) => h.jmeno.trim());
    if (platniHraci.length < 4) { setChyba("Zadej alespoň 4 hráče."); setStav("chyba"); return; }
    if (platniHraci.length % 2 !== 0) { setChyba("Počet hráčů musí být sudý."); setStav("chyba"); return; }

    const { data: hra, error: hraErr } = await supabase
      .from("hry")
      .insert({
        nazev: nazev.trim() || `${typ.charAt(0).toUpperCase() + typ.slice(1)} ${new Date().toLocaleDateString("cs-CZ")}`,
        typ,
        stav: "probiha",
        created_by: user.id,
        pocet_kurtu: pocetKurtu,
        body_na_zapas: bodyNaZapas,
      })
      .select()
      .single();

    if (hraErr || !hra) { setChyba("Nepodařilo se vytvořit hru."); setStav("chyba"); return; }

    const { data: ucastnici, error: ucastniciErr } = await supabase
      .from("hra_ucastnici")
      .insert(platniHraci.map((h) => ({ hra_id: hra.id, jmeno: h.jmeno.trim(), user_id: null })))
      .select();

    if (ucastniciErr || !ucastnici) { setChyba("Nepodařilo se přidat hráče."); setStav("chyba"); return; }

    if (typ === "americano") {
      const rozpis = generujAmericano(ucastnici.map((u) => ({ id: u.id, jmeno: u.jmeno })), pocetKurtu);
      await supabase.from("hra_zapasy").insert(
        rozpis.map((z) => ({
          hra_id: hra.id,
          kolo: z.kolo,
          kurt: z.kurt,
          tym1_hrac1_id: z.tym1[0],
          tym1_hrac2_id: z.tym1[1],
          tym2_hrac1_id: z.tym2[0],
          tym2_hrac2_id: z.tym2[1],
          faze: "skupiny",
        }))
      );
    }

    router.push(`/hry/${hra.id}`);
  }

  const odhadovanyVzas = typ !== "turnaj"
    ? pocetKurtu > 0 ? `Odhadovaný čas na kolo: ~${bodyNaZapas === 24 ? 12 : bodyNaZapas === 32 ? 15 : Math.round(bodyNaZapas * 0.45)} min` : ""
    : "";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-12" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="max-w-2xl mx-auto">

          {/* Hlavička */}
          <div className="mb-8">
            <a href="/hry" className="text-sm hover:underline" style={{ color: "#801A28" }}>Zpět na hry</a>
            <h1 className="text-2xl font-bold mt-3" style={{ color: "#801A28" }}>Nová hra</h1>
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map((k) => (
                <div key={k} className="h-1.5 flex-1 rounded-full"
                  style={{ backgroundColor: krok >= k ? "#801A28" : "#e5e7eb" }} />
              ))}
            </div>
          </div>

          {/* Krok 1 — Formát + základní parametry */}
          {krok === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-6" style={{ color: "#0A0A0A" }}>Jaký formát chceš hrát?</h2>
              <div className="flex flex-col gap-3 mb-8">
                {FORMATY.map((f) => (
                  <button key={f.typ} onClick={() => setTyp(f.typ)}
                    className={`text-left rounded-2xl border-2 p-5 transition-all bg-white ${typ === f.typ ? "border-[#801A28] shadow-md" : "border-zinc-200 hover:border-zinc-300"}`}>
                    <p className="font-bold mb-1" style={{ color: "#0A0A0A" }}>{f.nazev}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{f.popis}</p>
                  </button>
                ))}
              </div>

              {typ && (
                <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col gap-5 mb-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" style={{ color: "#374151" }}>Počet hráčů</label>
                    <div className="flex gap-2 flex-wrap">
                      {[4, 6, 8, 10, 12, 16].map((n) => (
                        <button key={n} onClick={() => nastavPocetHracu(n)}
                          className={`rounded-xl px-4 py-2.5 text-sm font-semibold border-2 transition-all ${pocetHracu === n ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" style={{ color: "#374151" }}>Počet kurtů</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((k) => (
                        <button key={k} onClick={() => setPocetKurtu(k)}
                          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all ${pocetKurtu === k ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  {typ !== "turnaj" && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium" style={{ color: "#374151" }}>Body na zápas</label>
                      <div className="flex gap-2 items-center">
                        {[16, 24, 32].map((b) => (
                          <button key={b} onClick={() => setBodyNaZapas(b)}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all ${bodyNaZapas === b ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                            {b}
                          </button>
                        ))}
                        <input type="number" min={8} max={99} value={bodyNaZapas}
                          onChange={(e) => setBodyNaZapas(Number(e.target.value))}
                          className="w-16 rounded-xl border-2 border-zinc-200 px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                      </div>
                      {odhadovanyVzas && (
                        <p className="text-xs" style={{ color: "#9ca3af" }}>{odhadovanyVzas}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setKrok(2)} disabled={!typ}
                className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: "#801A28" }}>
                Pokračovat
              </button>
            </div>
          )}

          {/* Krok 2 — Název */}
          {krok === 2 && (
            <div>
              <h2 className="text-lg font-semibold mb-6" style={{ color: "#0A0A0A" }}>Pojmenuj hru</h2>
              <div className="bg-white rounded-2xl border border-zinc-100 p-6 mb-6">
                <label className="text-sm font-medium block mb-2" style={{ color: "#374151" }}>Název hry (volitelné)</label>
                <input type="text" value={nazev} onChange={(e) => setNazev(e.target.value)}
                  placeholder={`${typ?.charAt(0).toUpperCase()}${typ?.slice(1)} ${new Date().toLocaleDateString("cs-CZ")}`}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setKrok(1)} className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-300 bg-white" style={{ color: "#374151" }}>Zpět</button>
                <button onClick={() => setKrok(3)} className="flex-1 rounded-full py-3 text-sm font-semibold text-white" style={{ backgroundColor: "#801A28" }}>Pokračovat</button>
              </div>
            </div>
          )}

          {/* Krok 3 — Hráči */}
          {krok === 3 && (
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: "#0A0A0A" }}>Přidej hráče</h2>
              <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
                {hraci.length} hráčů · hosté nemají účet, stačí jméno
              </p>

              <div className="flex flex-col gap-3 mb-4">
                {hraci.map((h, i) => (
                  <div key={i} className="bg-white rounded-xl border border-zinc-100 p-4 flex gap-3 items-center">
                    <span className="text-sm font-bold w-6 text-center shrink-0" style={{ color: "#9ca3af" }}>{i + 1}</span>
                    <input type="text" placeholder="Jméno" value={h.jmeno} onChange={(e) => updateHrac(i, "jmeno", e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                    <input type="email" placeholder="E-mail (nepovinné)" value={h.email} onChange={(e) => updateHrac(i, "email", e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                    {hraci.length > 4 && (
                      <button onClick={() => odeberHrace(i)} className="text-zinc-400 hover:text-red-500 transition-colors text-xl leading-none px-1">x</button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={pridejHrace}
                className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm font-medium mb-6 hover:border-[#801A28] transition-colors"
                style={{ color: "#6b7280" }}>
                Pridat hrace
              </button>

              {chyba && <p className="text-sm text-center mb-4" style={{ color: "#801A28" }}>{chyba}</p>}

              <div className="flex gap-3">
                <button onClick={() => setKrok(2)} className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-300 bg-white" style={{ color: "#374151" }}>Zpět</button>
                <button onClick={vytvorHru} disabled={stav === "loading"}
                  className="flex-1 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: "#801A28" }}>
                  {stav === "loading" ? "Vytvarim..." : "Spustit hru"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
