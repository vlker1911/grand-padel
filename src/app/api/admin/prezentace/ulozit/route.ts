import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TYPY_SPOLUPRACE, LOKALITY, VELIKOSTI_FIRMY } from "@/lib/brand";

export type Balicek = {
  nazev: string;
  popis: string;
  cena_min: number;
  cena_max: number;
  vhodne_pro: string;
};

export type GenerovanyObsah = {
  uvod: string;
  hodnota: string[];
  konkretni_navrhy: string[];
  cenove_balicky: Balicek[];
  call_to_action: string;
  dodatecne_info: string;
};

type Body = {
  firmaNazev?: string;
  firmaKontaktJmeno?: string;
  firmaKontaktPozice?: string;
  firmaKontaktEmail?: string;
  firmaKontaktTelefon?: string;
  firmaWeb?: string;
  typySpoluprace?: string[];
  lokalita?: string;
  velikostFirmy?: string;
  bezCen?: boolean;
  dodatecneInfo?: string;
  obsah?: GenerovanyObsah;
};

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ chyba: "Nevalidní JSON" }, { status: 400 });
  }

  const chyba = zkontroluj(body);
  if (chyba) return NextResponse.json({ chyba }, { status: 400 });

  const sdilenyToken = vygenerujToken();

  const { data: nova, error: dbErr } = await supabase
    .from("prezentace")
    .insert({
      vytvoril: user.id,
      firma_nazev: body.firmaNazev!.trim(),
      firma_kontakt_jmeno: body.firmaKontaktJmeno?.trim() || null,
      firma_kontakt_pozice: body.firmaKontaktPozice?.trim() || null,
      firma_kontakt_email: body.firmaKontaktEmail?.trim() || null,
      firma_kontakt_telefon: body.firmaKontaktTelefon?.trim() || null,
      firma_web: body.firmaWeb?.trim() || null,
      typy_spoluprace: body.typySpoluprace!,
      lokalita: body.lokalita!,
      velikost_firmy: body.velikostFirmy!,
      bez_cen: body.bezCen === true,
      dodatecne_info: body.dodatecneInfo?.trim() || null,
      generovany_obsah: body.obsah ?? null,
      sdileny_token: sdilenyToken,
    })
    .select("id")
    .single();

  if (dbErr) {
    return NextResponse.json(
      { chyba: `Uložení selhalo: ${dbErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: nova.id });
}

function zkontroluj(b: Body): string | null {
  if (!b.firmaNazev?.trim()) return "Chybí název firmy";
  if (!Array.isArray(b.typySpoluprace) || b.typySpoluprace.length === 0)
    return "Chybí typ spolupráce";
  const validTypy = new Set(TYPY_SPOLUPRACE.map((t) => t.value));
  if (b.typySpoluprace.some((t) => !validTypy.has(t as never)))
    return "Neznámý typ spolupráce";
  if (!b.lokalita || !LOKALITY.some((l) => l.value === b.lokalita))
    return "Neznámá lokalita";
  if (!b.velikostFirmy || !VELIKOSTI_FIRMY.some((v) => v.value === b.velikostFirmy))
    return "Neznámá velikost firmy";
  return null;
}

function vygenerujToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
