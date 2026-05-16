"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { generujAmericano } from "@/lib/americano";

type Typ = "americano" | "mexicano" | "mixano" | "turnaj";

const FORMATY = [
  { typ: "americano" as Typ, emoji: "🔄", nazev: "Americano", popis: "Rotující páry, individuální skóre. Každý hraje s každým." },
  { typ: "mexicano" as Typ, emoji: "🏆", nazev: "Mexicano", popis: "Jako Americano, ale losování podle průběžné tabulky." },
  { typ: "mixano" as Typ, emoji: "⚡", nazev: "Mixano", popis: "Mexicano se smíšenými páry (muž + žena)." },
  { typ: "turnaj" as Typ, emoji: "🥇", nazev: "Turnaj", popis: "Skupinová fáze + volitelný playoff pavouk. Hrají páry." },
];

type HracEntry = { jmeno: string; email: string };

export default function NovaHraPage() {
  const router = useRouter();
  const supabase = createClient();

  const [krok, setKrok] = useState<1 | 2 | 3>(1);
  const [typ, setTyp] = useState<Typ | null>(null);
  const [nazev, setNazev] = useState("");
  const [pocetKurtu, setPocetKurtu] = useState(2);
  const [bodyNaZapas, setBodyNaZapas] = useState(24);
  const [hraci, setHraci] = useState<HracEntry[]>([
    { jmeno: "", email: "" },
    { jmeno: "", email: "" },
    { jmeno: "", email: "" },
    { jmeno: "", email: "" },
  ]);
  const [stav, setStav] = useState<"idle" | "loading" | "chyba">("idle");
  const [chyba, setChyba] = useState("");

  function pridejHrace() {
    setHraci([...hraci, { jmeno: "", email: "" }]);
  }

  function odeberHrace(i: number) {
    setHraci(hraci.filter((_, idx) => idx !== i));
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

    // Vytvoř hru
    const { data: hra, error: hraErr } = await supabase
      .from("hry")
      .insert({ nazev: nazev || `${typ.charAt(0).toUpperCase() + typ.slice(1)} ${new Date().toLocaleDateString("cs-CZ")}`, typ, stav: "probiha", created_by: user.id, pocet_kurtu: pocetKurtu, body_na_zapas: bodyNaZapas })
      .select()
      .single();

    if (hraErr || !hra) { setChyba("Nepodařilo se vytvořit hru."); setStav("chyba"); return; }

    // Vlož hráče a zjisti jejich user_id pokud mají email
    const ucastniciInsert = platniHraci.map((h) => ({
      hra_id: hra.id,
      jmeno: h.jmeno.trim(),
      user_id: null as string | null,
    }));

    // Zkus dohledat user_id přihlášeného organizátora podle emailu (jednoduchá vazba)
    const { data: ucastnici, error: ucastniciErr } = await supabase
      .from("hra_ucastnici")
      .insert(ucastniciInsert)
      .select();

    if (ucastniciErr || !ucastnici) { setChyba("Nepodařilo se přidat hráče."); setStav("chyba"); return; }

    // Vygeneruj zápasy pro Americano/Mexicano/Mixano
    if (typ !== "turnaj") {
      const rozpis = generujAmericano(ucastnici.map((u) => ({ id: u.id, jmeno: u.jmeno })), pocetKurtu);
      const zapasyInsert = rozpis.map((z) => ({
        hra_id: hra.id,
        kolo: z.kolo,
        kurt: z.kurt,
        tym1_hrac1_id: z.tym1[0],
        tym1_hrac2_id: z.tym1[1],
        tym2_hrac1_id: z.tym2[0],
        tym2_hrac2_id: z.tym2[1],
        faze: "skupiny",
      }));

      await supabase.from("hra_zapasy").insert(zapasyInsert);
    }

    router.push(`/hry/${hra.id}`);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-12" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="max-w-2xl mx-auto">

          {/* Hlavička */}
          <div className="mb-8">
            <a href="/hry" className="text-sm hover:underline" style={{ color: "#801A28" }}>← Zpět na hry</a>
            <h1 className="text-2xl font-bold mt-3" style={{ color: "#801A28" }}>Nová hra</h1>
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map((k) => (
                <div key={k} className={`h-1.5 flex-1 rounded-full transition-colors ${krok >= k ? "" : "bg-zinc-200"}`}
                  style={{ backgroundColor: krok >= k ? "#801A28" : undefined }} />
              ))}
            </div>
          </div>

          {/* Krok 1 — Formát */}
          {krok === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-6" style={{ color: "#0A0A0A" }}>Jaký formát chceš hrát?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {FORMATY.map((f) => (
                  <button key={f.typ} onClick={() => setTyp(f.typ)}
                    className={`text-left rounded-2xl border-2 p-5 transition-all ${typ === f.typ ? "border-[#801A28] bg-white shadow-md" : "border-zinc-200 bg-white hover:border-zinc-300"}`}>
                    <span className="text-3xl">{f.emoji}</span>
                    <p className="font-bold mt-2 mb-1" style={{ color: "#0A0A0A" }}>{f.nazev}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{f.popis}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setKrok(2)} disabled={!typ}
                className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: "#801A28" }}>
                Pokračovat
              </button>
            </div>
          )}

          {/* Krok 2 — Parametry */}
          {krok === 2 && (
            <div>
              <h2 className="text-lg font-semibold mb-6" style={{ color: "#0A0A0A" }}>Nastavení hry</h2>
              <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col gap-5 mb-6">

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: "#374151" }}>Název hry (volitelné)</label>
                  <input type="text" value={nazev} onChange={(e) => setNazev(e.target.value)}
                    placeholder={`${typ?.charAt(0).toUpperCase()}${typ?.slice(1)} ${new Date().toLocaleDateString("cs-CZ")}`}
                    className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: "#374151" }}>Počet kurtů</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((k) => (
                      <button key={k} onClick={() => setPocetKurtu(k)}
                        className={`flex-1 rounded-xl py-3 text-sm font-semibold border-2 transition-all ${pocetKurtu === k ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                {typ !== "turnaj" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium" style={{ color: "#374151" }}>Body na zápas</label>
                    <div className="flex gap-2">
                      {[16, 24, 32].map((b) => (
                        <button key={b} onClick={() => setBodyNaZapas(b)}
                          className={`flex-1 rounded-xl py-3 text-sm font-semibold border-2 transition-all ${bodyNaZapas === b ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                          {b}
                        </button>
                      ))}
                      <input type="number" min={8} max={99} value={bodyNaZapas}
                        onChange={(e) => setBodyNaZapas(Number(e.target.value))}
                        className="w-16 rounded-xl border-2 border-zinc-200 px-2 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setKrok(1)} className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-300 bg-white" style={{ color: "#374151" }}>
                  Zpět
                </button>
                <button onClick={() => setKrok(3)} className="flex-1 rounded-full py-3 text-sm font-semibold text-white" style={{ backgroundColor: "#801A28" }}>
                  Pokračovat
                </button>
              </div>
            </div>
          )}

          {/* Krok 3 — Hráči */}
          {krok === 3 && (
            <div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: "#0A0A0A" }}>
                {typ === "turnaj" ? "Přidej páry (týmy)" : "Přidej hráče"}
              </h2>
              <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
                Minimum 4 hráče · sudý počet · hosté nemají účet, stačí jméno
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
                      <button onClick={() => odeberHrace(i)} className="text-zinc-400 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={pridejHrace}
                className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm font-medium mb-6 hover:border-[#801A28] transition-colors"
                style={{ color: "#6b7280" }}>
                + Přidat hráče
              </button>

              {chyba && <p className="text-sm text-center mb-4" style={{ color: "#801A28" }}>{chyba}</p>}

              <div className="flex gap-3">
                <button onClick={() => setKrok(2)} className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-300 bg-white" style={{ color: "#374151" }}>
                  Zpět
                </button>
                <button onClick={vytvorHru} disabled={stav === "loading"}
                  className="flex-1 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: "#801A28" }}>
                  {stav === "loading" ? "Vytváří se…" : "Spustit hru 🎾"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
