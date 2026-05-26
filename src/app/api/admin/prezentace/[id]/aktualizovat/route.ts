import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TYPY_SPOLUPRACE, LOKALITY, VELIKOSTI_FIRMY } from "@/lib/brand";
import type { GenerovanyObsah } from "@/app/api/admin/prezentace/ulozit/route";

export const runtime = "nodejs";

type MetaInput = {
  typySpoluprace?: string[];
  lokalita?: string;
  velikostFirmy?: string;
  firmaBarva?: string;
  firmaBarvaSekundarni?: string;
  firmaKontaktJmeno?: string;
  firmaKontaktPozice?: string;
  firmaKontaktEmail?: string;
  firmaKontaktTelefon?: string;
  firmaWeb?: string;
  dodatecneInfo?: string;
  bezCen?: boolean;
};

type Body = {
  meta?: MetaInput;
  obsah?: GenerovanyObsah;
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ chyba: "Nepřihlášen" }, { status: 401 });

  const { data: profil } = await supabase
    .from("profily")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profil?.role !== "management") {
    return NextResponse.json({ chyba: "Nemáš oprávnění" }, { status: 403 });
  }

  let body: Body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ chyba: "Nevalidní JSON" }, { status: 400 }); }

  const m = body.meta ?? {};

  // Validace volitelných polí
  if (m.typySpoluprace !== undefined && !Array.isArray(m.typySpoluprace))
    return NextResponse.json({ chyba: "typySpoluprace musí být pole" }, { status: 400 });
  const validTypy = new Set(TYPY_SPOLUPRACE.map((t) => t.value));
  if (m.typySpoluprace?.some((t) => !validTypy.has(t as never)))
    return NextResponse.json({ chyba: "Neznámý typ spolupráce" }, { status: 400 });
  if (m.lokalita && !LOKALITY.some((l) => l.value === m.lokalita))
    return NextResponse.json({ chyba: "Neznámá lokalita" }, { status: 400 });
  if (m.velikostFirmy && !VELIKOSTI_FIRMY.some((v) => v.value === m.velikostFirmy))
    return NextResponse.json({ chyba: "Neznámá velikost firmy" }, { status: 400 });

  // Sestavit update objekt jen z poskytnutých polí
  const update: Record<string, unknown> = {};
  if (m.typySpoluprace !== undefined) update.typy_spoluprace = m.typySpoluprace.length ? m.typySpoluprace : null;
  if (m.lokalita !== undefined) update.lokalita = m.lokalita || null;
  if (m.velikostFirmy !== undefined) update.velikost_firmy = m.velikostFirmy || null;
  if (m.firmaBarva !== undefined) update.firma_barva = m.firmaBarva.trim() || null;
  if (m.firmaBarvaSekundarni !== undefined) update.firma_barva_sekundarni = m.firmaBarvaSekundarni.trim() || null;
  if (m.firmaKontaktJmeno !== undefined) update.firma_kontakt_jmeno = m.firmaKontaktJmeno.trim() || null;
  if (m.firmaKontaktPozice !== undefined) update.firma_kontakt_pozice = m.firmaKontaktPozice.trim() || null;
  if (m.firmaKontaktEmail !== undefined) update.firma_kontakt_email = m.firmaKontaktEmail.trim() || null;
  if (m.firmaKontaktTelefon !== undefined) update.firma_kontakt_telefon = m.firmaKontaktTelefon.trim() || null;
  if (m.firmaWeb !== undefined) update.firma_web = m.firmaWeb.trim() || null;
  if (m.dodatecneInfo !== undefined) update.dodatecne_info = m.dodatecneInfo.trim() || null;
  if (m.bezCen !== undefined) update.bez_cen = m.bezCen === true;
  if (body.obsah !== undefined) update.generovany_obsah = body.obsah;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ chyba: "Nic k aktualizaci" }, { status: 400 });
  }

  const { error } = await supabase
    .from("prezentace")
    .update(update)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ chyba: `Aktualizace selhala: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
