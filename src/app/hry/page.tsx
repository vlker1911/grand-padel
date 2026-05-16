"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";

type Hra = {
  id: string;
  nazev: string;
  typ: "americano" | "mexicano" | "mixano" | "turnaj";
  stav: "priprava" | "probiha" | "ukonceno";
  pocet_kurtu: number;
  body_na_zapas: number | null;
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
  americano: "#801A28",
  mexicano: "#b45309",
  mixano: "#6d28d9",
  turnaj: "#0f766e",
};

const STAV_LABEL: Record<string, string> = {
  priprava: "Příprava",
  probiha: "Probíhá",
  ukonceno: "Ukončeno",
};

export default function HryPage() {
  const [hry, setHry] = useState<Hra[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("hry")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setHry(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-12" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="max-w-4xl mx-auto">

          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#801A28" }}>Herní centrum</h1>
              <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>Americano, Mexicano, Mixano, Turnaj</p>
            </div>
            <Link href="/hry/nova"
              className="rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#801A28" }}>
              + Nová hra
            </Link>
          </div>

          {loading && (
            <div className="text-center py-20 text-sm" style={{ color: "#9ca3af" }}>Načítám hry…</div>
          )}

          {!loading && hry.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg font-semibold mb-2" style={{ color: "#0A0A0A" }}>Zatím žádné hry</p>
              <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Vytvoř první hru a pozvi kamarády!</p>
              <Link href="/hry/nova"
                className="rounded-full px-6 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: "#801A28" }}>
                Vytvoř první hru
              </Link>
            </div>
          )}

          {!loading && hry.length > 0 && (
            <div className="flex flex-col gap-4">
              {hry.map((hra) => (
                <Link key={hra.id} href={`/hry/${hra.id}`}
                  className="bg-white rounded-2xl border border-zinc-100 p-5 hover:shadow-md transition-shadow flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="rounded-xl px-3 py-1 text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: TYP_COLOR[hra.typ] }}>
                      {TYP_LABEL[hra.typ]}
                    </span>
                    <div>
                      <p className="font-semibold" style={{ color: "#0A0A0A" }}>{hra.nazev}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                        {hra.pocet_kurtu} {hra.pocet_kurtu === 1 ? "kurt" : hra.pocet_kurtu < 5 ? "kurty" : "kurtů"}
                        {hra.body_na_zapas ? ` · ${hra.body_na_zapas} bodů` : ""}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    hra.settings?.zruseno ? "bg-red-50 text-red-700" :
                    hra.stav === "probiha" ? "bg-green-100 text-green-700" :
                    hra.stav === "ukonceno" ? "bg-zinc-100 text-zinc-500" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {hra.settings?.zruseno ? "Zrušeno" : STAV_LABEL[hra.stav]}
                  </span>
                </Link>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
