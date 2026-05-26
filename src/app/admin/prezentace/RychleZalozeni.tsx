"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { brand } from "@/lib/brand";

export default function RychleZalozeni() {
  const router = useRouter();
  const [firmaNazev, setFirmaNazev] = useState("");
  const [vytvori, setVytvori] = useState(false);
  const [chyba, setChyba] = useState<string | null>(null);

  async function vytvorit(e: React.FormEvent) {
    e.preventDefault();
    if (!firmaNazev.trim()) return;
    setVytvori(true);
    setChyba(null);
    try {
      const r = await fetch("/api/admin/prezentace/ulozit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmaNazev: firmaNazev.trim() }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.chyba ?? "Vytvoření selhalo");
      router.push(`/admin/prezentace/${json.id}`);
    } catch (e) {
      setChyba(e instanceof Error ? e.message : "Vytvoření selhalo");
      setVytvori(false);
    }
  }

  return (
    <form onSubmit={vytvorit} className="bg-white rounded-2xl shadow-sm p-5 mb-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <label className="text-sm font-semibold whitespace-nowrap" style={{ color: brand.colors.muted }}>
          RYCHLÉ ZALOŽENÍ
        </label>
        <input
          type="text"
          value={firmaNazev}
          onChange={(e) => setFirmaNazev(e.target.value)}
          placeholder="Název firmy (Alza, Rohlík, ČEZ…)"
          className="flex-1 rounded-full border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          style={{ outlineColor: brand.colors.red }}
        />
        <button
          type="submit"
          disabled={vytvori || firmaNazev.trim() === ""}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap transition-opacity disabled:opacity-40"
          style={{ backgroundColor: brand.colors.red }}
        >
          {vytvori ? "Vytvářím…" : "Vytvořit prezentaci"}
        </button>
      </div>
      <p className="text-xs mt-2" style={{ color: brand.colors.muted }}>
        Stačí jen název firmy. Vše ostatní (lokalita, typ spolupráce, obsah) doplníš na detail stránce přes AI.
      </p>
      {chyba && (
        <p className="text-sm mt-2" style={{ color: brand.colors.red }}>{chyba}</p>
      )}
    </form>
  );
}
