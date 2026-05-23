import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { PrezentacePdf, type PrezentaceData } from "@/lib/pdf/PrezentacePdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { data: prezentace, error } = await supabase
    .from("prezentace")
    .select("*")
    .eq("id", id)
    .maybeSingle<PrezentaceData>();

  if (error || !prezentace) {
    return NextResponse.json({ chyba: "Prezentace nenalezena" }, { status: 404 });
  }
  if (!prezentace.generovany_obsah) {
    return NextResponse.json({ chyba: "Prezentace nemá obsah" }, { status: 400 });
  }

  let logoBase64: string | undefined;
  try {
    const logoPath = path.join(process.cwd(), "public", "gp-logo-full.png");
    const buf = await readFile(logoPath);
    logoBase64 = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    // Logo nedostupné — PDF se vyrenderuje bez něj
  }

  const buffer = await renderToBuffer(<PrezentacePdf data={prezentace} logoBase64={logoBase64} />);

  const filename = `grand-padel-${slugify(prezentace.firma_nazev)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
