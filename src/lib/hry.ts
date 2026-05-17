import type { SupabaseClient } from "@supabase/supabase-js";

export type HraTyp = "americano" | "mexicano" | "mixano" | "turnaj";

export type PoctyMazani = {
  pocetZapasu: number;
  pocetUcastniku: number;
};

export async function nactiPoctyMazani(
  supabase: SupabaseClient,
  hraId: string,
  typ: HraTyp,
): Promise<PoctyMazani> {
  const tabulkaZapasu = typ === "turnaj" ? "turnaj_zapasy" : "hra_zapasy";
  const [zapasy, ucast] = await Promise.all([
    supabase.from(tabulkaZapasu).select("id", { count: "exact", head: true }).eq("hra_id", hraId),
    supabase.from("hra_ucastnici").select("id", { count: "exact", head: true }).eq("hra_id", hraId),
  ]);
  return {
    pocetZapasu: zapasy.count ?? 0,
    pocetUcastniku: ucast.count ?? 0,
  };
}

export async function smazatHru(
  supabase: SupabaseClient,
  hraId: string,
  typ: HraTyp,
): Promise<{ error: string | null }> {
  async function smaz(popis: string, table: string, sloupec: string, hodnota: string | string[]) {
    const q = supabase.from(table).delete();
    const { error } = Array.isArray(hodnota)
      ? await q.in(sloupec, hodnota)
      : await q.eq(sloupec, hodnota);
    if (error) return `Chyba pri mazani ${popis}: ${error.message}`;
    return null;
  }

  if (typ === "turnaj") {
    const kroky: Array<[string, string, string, string]> = [
      ["zapasu turnaje", "turnaj_zapasy", "hra_id", hraId],
      ["tymu", "turnaj_tymy", "hra_id", hraId],
      ["ucastniku", "hra_ucastnici", "hra_id", hraId],
      ["editatoru", "hra_editatori", "hra_id", hraId],
      ["hry", "hry", "id", hraId],
    ];
    for (const [popis, table, sloupec, hodnota] of kroky) {
      const err = await smaz(popis, table, sloupec, hodnota);
      if (err) return { error: err };
    }
    return { error: null };
  }

  // americano / mexicano / mixano
  const { data: skupiny } = await supabase
    .from("hra_skupiny")
    .select("id")
    .eq("hra_id", hraId);
  const skupinyIds = (skupiny ?? []).map((s: { id: string }) => s.id);

  const e1 = await smaz("zapasu", "hra_zapasy", "hra_id", hraId);
  if (e1) return { error: e1 };
  if (skupinyIds.length > 0) {
    const e2 = await smaz("rozdeleni do skupin", "hra_skupiny_ucastnici", "skupina_id", skupinyIds);
    if (e2) return { error: e2 };
  }
  const e3 = await smaz("skupin", "hra_skupiny", "hra_id", hraId);
  if (e3) return { error: e3 };
  const e4 = await smaz("ucastniku", "hra_ucastnici", "hra_id", hraId);
  if (e4) return { error: e4 };
  const e5 = await smaz("editatoru", "hra_editatori", "hra_id", hraId);
  if (e5) return { error: e5 };
  const e6 = await smaz("hry", "hry", "id", hraId);
  if (e6) return { error: e6 };
  return { error: null };
}
