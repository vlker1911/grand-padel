"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { generujAmericano } from "@/lib/americano";

type Typ = "americano" | "mexicano" | "turnaj";

const FORMATY: { typ: Typ; nazev: string; popis: string }[] = [
  { typ: "americano", nazev: "Americano", popis: "Rotující páry, individuální skóre. Každý hraje s každým." },
  { typ: "mexicano", nazev: "Mexicano", popis: "Hráči jsou přiřazeni na kurty. Po každém kole se přesouvají podle výsledků. Hraje se na čas." },
  { typ: "turnaj",   nazev: "Turnaj",    popis: "Skupinová fáze pro páry/týmy. Volitelný playoff pavouk. Harmonogram s časovým plánem." },
];

type HracEntry = { jmeno: string; email: string };

function odhadMinut(body: number) {
  if (body === 16) return 8;
  if (body === 24) return 12;
  if (body === 32) return 15;
  return Math.round(body * 0.45);
}

export default function NovaHraPage() {
  const router = useRouter();
  const supabase = createClient();

  const [krok, setKrok] = useState<1 | 2 | 3>(1);
  const [typ, setTyp] = useState<Typ | null>(null);

  // Parametry
  const [pocetHracu, setPocetHracu] = useState<number | "">(8);
  const [pocetKurtu, setPocetKurtu] = useState<number | "">(2);
  const [cislaMexicano, setCislaMexicano] = useState("1, 2");
  const [casOd, setCasOd] = useState("16:00");
  const [casDo, setCasDo] = useState("18:00");

  // Americano / Mexicano
  const [bodyNaZapas, setBodyNaZapas] = useState(24);
  const [minutNaKolo, setMinutNaKolo] = useState(12); // Mexicano

  // Název
  const [nazev, setNazev] = useState("");

  // Hráči
  const [hraci, setHraci] = useState<HracEntry[]>(
    Array.from({ length: 8 }, () => ({ jmeno: "", email: "" }))
  );

  const [stav, setStav] = useState<"idle" | "loading" | "chyba">("idle");
  const [chyba, setChyba] = useState("");

  function nastavPocetHracu(n: number) {
    const validN = Math.max(4, n);
    setPocetHracu(validN);
    setHraci((prev) => {
      if (validN > prev.length) return [...prev, ...Array.from({ length: validN - prev.length }, () => ({ jmeno: "", email: "" }))];
      return prev.slice(0, validN);
    });
  }

  function pridejHrace() {
    setHraci([...hraci, { jmeno: "", email: "" }]);
    setPocetHracu(typeof pocetHracu === "number" ? pocetHracu + 1 : 1);
  }

  function odeberHrace(i: number) {
    if (hraci.length <= 4) return;
    const novi = hraci.filter((_, idx) => idx !== i);
    setHraci(novi);
    setPocetHracu(novi.length);
  }

  function updateHrac(i: number, pole: keyof HracEntry, hodnota: string) {
    const novi = [...hraci];
    novi[i] = { ...novi[i], [pole]: hodnota };
    setHraci(novi);
  }

  // Výpočet harmonogramu turnaje
  function vypocitejHarmonogram() {
    const k = typeof pocetKurtu === "number" ? pocetKurtu : 2;
    const h = typeof pocetHracu === "number" ? pocetHracu : 8;
    const tymy = Math.ceil(h / 2);
    const kolaSku = Math.max(tymy - 1, 1); // zjednodušeno
    const minNaZapas = odhadMinut(bodyNaZapas);
    const [hodOd, minOd] = casOd.split(":").map(Number);
    const totalMin = (parseInt(casDo) - hodOd) * 60 + (parseInt(casDo.split(":")[1]) - minOd);
    const lines: string[] = [];
    let cur = hodOd * 60 + minOd + 5; // 5 min rozehřívání
    for (let kolo = 1; kolo <= kolaSku; kolo++) {
      const konec = cur + minNaZapas;
      const hKonec = Math.floor(konec / 60).toString().padStart(2, "0");
      const mKonec = (konec % 60).toString().padStart(2, "0");
      lines.push(`Kolo ${kolo}: ${Math.floor(cur / 60).toString().padStart(2, "0")}:${(cur % 60).toString().padStart(2, "0")} – ${hKonec}:${mKonec}`);
      cur = konec + 1;
    }
    return lines;
  }

  async function vytvorHru() {
    if (!typ) return;
    setStav("loading");
    setChyba("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setChyba("Musíš být přihlášen."); setStav("chyba"); return; }

    const platniHraci = hraci.filter((h) => h.jmeno.trim());
    if (platniHraci.length < 4) { setChyba("Zadej alespoň 4 hráče."); setStav("chyba"); return; }
    if (typ !== "turnaj" && platniHraci.length % 2 !== 0) { setChyba("Počet hráčů musí být sudý."); setStav("chyba"); return; }

    const k = typeof pocetKurtu === "number" ? pocetKurtu : 2;

    const { data: hra, error: hraErr } = await supabase
      .from("hry")
      .insert({
        nazev: nazev.trim() || `${FORMATY.find(f => f.typ === typ)?.nazev} ${new Date().toLocaleDateString("cs-CZ")}`,
        typ,
        stav: "probiha",
        created_by: user.id,
        pocet_kurtu: k,
        body_na_zapas: typ === "mexicano" ? minutNaKolo : bodyNaZapas,
        settings: {
          cas_od: casOd,
          cas_do: casDo,
          minut_na_kolo: minutNaKolo,
          cisla_kurtu: typ === "mexicano"
            ? cislaMexicano.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n)).sort((a,b) => a-b)
            : null,
        },
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
      const rozpis = generujAmericano(ucastnici.map((u) => ({ id: u.id, jmeno: u.jmeno })), k);
      await supabase.from("hra_zapasy").insert(
        rozpis.map((z) => ({
          hra_id: hra.id, kolo: z.kolo, kurt: z.kurt,
          tym1_hrac1_id: z.tym1[0], tym1_hrac2_id: z.tym1[1],
          tym2_hrac1_id: z.tym2[0], tym2_hrac2_id: z.tym2[1],
          faze: "skupiny",
        }))
      );
    }

    router.push(`/hry/${hra.id}`);
  }

  const harmonogram = typ === "turnaj" && krok === 2 ? vypocitejHarmonogram() : [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-12" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="max-w-2xl mx-auto">

          <div className="mb-8">
            <a href="/hry" className="text-sm hover:underline" style={{ color: "#801A28" }}>Zpet na hry</a>
            <h1 className="text-2xl font-bold mt-3" style={{ color: "#801A28" }}>Nova hra</h1>
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map((k) => (
                <div key={k} className="h-1.5 flex-1 rounded-full"
                  style={{ backgroundColor: krok >= k ? "#801A28" : "#e5e7eb" }} />
              ))}
            </div>
          </div>

          {/* KROK 1 — Format + parametry */}
          {krok === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-base font-semibold mb-3" style={{ color: "#0A0A0A" }}>Format hry</h2>
                <div className="flex flex-col gap-3">
                  {FORMATY.map((f) => (
                    <button key={f.typ} onClick={() => setTyp(f.typ)}
                      className={`text-left rounded-2xl border-2 p-5 bg-white transition-all ${typ === f.typ ? "border-[#801A28] shadow-md" : "border-zinc-200 hover:border-zinc-300"}`}>
                      <p className="font-bold mb-1" style={{ color: "#0A0A0A" }}>{f.nazev}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{f.popis}</p>
                    </button>
                  ))}
                </div>
              </div>

              {typ && (
                <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col gap-5">

                  {/* Pocet hracu */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: "#374151" }}>
                      {typ === "turnaj" ? "Pocet tymu" : "Pocet hracu"}
                    </label>
                    <input
                      type="number" min={4} max={256}
                      value={pocetHracu}
                      onChange={(e) => {
                        const n = parseInt(e.target.value);
                        if (!isNaN(n)) nastavPocetHracu(n);
                        else setPocetHracu("");
                      }}
                      placeholder={typ === "turnaj" ? "napr. 8 tymu" : "napr. 16 hracu"}
                      className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]"
                    />
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      {typ === "turnaj" ? "Kazdy tym jsou 2 hraci (par)." : "Minimum 4, vzdy sudy pocet."}
                    </p>
                  </div>

                  {/* Pocet kurtu */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: "#374151" }}>Pocet kurtu</label>
                    <input
                      type="number" min={1} max={20}
                      value={pocetKurtu}
                      onChange={(e) => {
                        const n = parseInt(e.target.value);
                        if (!isNaN(n)) {
                          setPocetKurtu(n);
                          if (typ === "mexicano") {
                            setCislaMexicano(Array.from({ length: n }, (_, i) => i + 1).join(", "));
                          }
                        } else setPocetKurtu("");
                      }}
                      placeholder="napr. 4"
                      className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]"
                    />
                  </div>

                  {/* Cas k dispozici */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: "#374151" }}>Cas k dispozici</label>
                    <div className="flex items-center gap-3">
                      <input type="time" value={casOd} onChange={(e) => setCasOd(e.target.value)}
                        className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                      <span className="text-sm font-medium" style={{ color: "#9ca3af" }}>–</span>
                      <input type="time" value={casDo} onChange={(e) => setCasDo(e.target.value)}
                        className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                    </div>
                  </div>

                  {/* Body / cas na zapas — Americano */}
                  {typ === "americano" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium" style={{ color: "#374151" }}>Body na zapas</label>
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
                      <p className="text-xs" style={{ color: "#9ca3af" }}>
                        {bodyNaZapas} bodu = cca {odhadMinut(bodyNaZapas)} minut na zapas
                      </p>
                    </div>
                  )}

                  {/* Cisla kurtu + minut na kolo — Mexicano */}
                  {typ === "mexicano" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium" style={{ color: "#374151" }}>Cisla kurtu (oddelena carkou)</label>
                      <input type="text" value={cislaMexicano} onChange={(e) => {
                        setCislaMexicano(e.target.value);
                        const cisla = e.target.value.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                        if (cisla.length > 0) setPocetKurtu(cisla.length);
                      }}
                        placeholder="napr. 3, 4, 5, 6"
                        className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                      <p className="text-xs" style={{ color: "#9ca3af" }}>
                        Nejnizsi cislo = nejlepsi kurt. Zadej kurty ktere mas k dispozici.
                      </p>
                    </div>
                  )}
                  {typ === "mexicano" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium" style={{ color: "#374151" }}>Minut na kolo</label>
                      <div className="flex gap-2 items-center">
                        {[10, 12, 15].map((m) => (
                          <button key={m} onClick={() => setMinutNaKolo(m)}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all ${minutNaKolo === m ? "border-[#801A28] text-[#801A28] bg-red-50" : "border-zinc-200 text-zinc-600"}`}>
                            {m} min
                          </button>
                        ))}
                        <input type="number" min={5} max={30} value={minutNaKolo}
                          onChange={(e) => setMinutNaKolo(Number(e.target.value))}
                          className="w-16 rounded-xl border-2 border-zinc-200 px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                      </div>
                      <p className="text-xs" style={{ color: "#9ca3af" }}>Doporucujeme 10–12 minut na kolo.</p>
                    </div>
                  )}

                  {/* Body na zapas — Turnaj */}
                  {typ === "turnaj" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium" style={{ color: "#374151" }}>Body na zapas</label>
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
                      <p className="text-xs" style={{ color: "#9ca3af" }}>
                        {bodyNaZapas} bodu = cca {odhadMinut(bodyNaZapas)} minut na zapas
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setKrok(2)} disabled={!typ}
                className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: "#801A28" }}>
                Pokracovat
              </button>
            </div>
          )}

          {/* KROK 2 — Nazev + nahlad harmonogramu */}
          {krok === 2 && (
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-zinc-100 p-6">
                <label className="text-sm font-medium block mb-2" style={{ color: "#374151" }}>Nazev hry (volitelne)</label>
                <input type="text" value={nazev} onChange={(e) => setNazev(e.target.value)}
                  placeholder={`${FORMATY.find(f => f.typ === typ)?.nazev} ${new Date().toLocaleDateString("cs-CZ")}`}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
              </div>

              {/* Harmonogram turnaje */}
              {harmonogram.length > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-100 p-6">
                  <h3 className="text-sm font-semibold mb-4" style={{ color: "#0A0A0A" }}>Navrhovany harmonogram</h3>
                  <div className="flex flex-col gap-2">
                    {harmonogram.map((radek, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-zinc-50 last:border-0">
                        <span style={{ color: "#374151" }}>{radek}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-3" style={{ color: "#9ca3af" }}>
                    Vcetne 5 minut na rozehru. Harmonogram se upravi podle skutecneho prubenu.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setKrok(1)} className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-300 bg-white" style={{ color: "#374151" }}>Zpet</button>
                <button onClick={() => setKrok(3)} className="flex-1 rounded-full py-3 text-sm font-semibold text-white" style={{ backgroundColor: "#801A28" }}>Pokracovat</button>
              </div>
            </div>
          )}

          {/* KROK 3 — Hraci */}
          {krok === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold mb-1" style={{ color: "#0A0A0A" }}>
                  {typ === "turnaj" ? "Pridej tymy (pary)" : "Pridej hrace"}
                </h2>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  {hraci.length} {typ === "turnaj" ? "tymu" : "hracu"} · hosty staci zadat jmenem
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {hraci.map((h, i) => (
                  <div key={i} className="bg-white rounded-xl border border-zinc-100 p-4 flex gap-3 items-center">
                    <span className="text-sm font-bold w-6 text-center shrink-0" style={{ color: "#9ca3af" }}>{i + 1}</span>
                    <input type="text"
                      placeholder={typ === "turnaj" ? "Nazev tymu nebo jmena hracu" : "Jmeno"}
                      value={h.jmeno} onChange={(e) => updateHrac(i, "jmeno", e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                    <input type="email" placeholder="E-mail (nepovinne)" value={h.email} onChange={(e) => updateHrac(i, "email", e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
                    {hraci.length > 4 && (
                      <button onClick={() => odeberHrace(i)} className="text-zinc-400 hover:text-red-500 transition-colors text-xl leading-none px-1">x</button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={pridejHrace}
                className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm font-medium hover:border-[#801A28] transition-colors"
                style={{ color: "#6b7280" }}>
                Pridat hrace
              </button>

              {chyba && <p className="text-sm text-center" style={{ color: "#801A28" }}>{chyba}</p>}

              <div className="flex gap-3">
                <button onClick={() => setKrok(2)} className="flex-1 rounded-full py-3 text-sm font-semibold border border-zinc-300 bg-white" style={{ color: "#374151" }}>Zpet</button>
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
