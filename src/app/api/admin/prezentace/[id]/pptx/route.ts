import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { type PhotoSet, type PrezentaceData } from "@/lib/pdf/PrezentacePdf";
import { generujPptx } from "@/lib/pptx/PrezentacePptx";

export const runtime = "nodejs";

const GLOBAL_PHOTO_FILES: Record<keyof PhotoSet, string> = {
  hero: "hero-kurt.jpg",
  akce: "akce-hraci.jpg",
  center: "center-kurt.jpg",
  centerVstup: "center-kurt-vstup.jpg",
  teambuilding: "teambuilding.jpg",
  detail: "detail-raketa.jpg",
};

async function zkusitNacist(fullPath: string): Promise<string | undefined> {
  try {
    const buf = await readFile(fullPath);
    const ext = fullPath.toLowerCase().endsWith(".png") ? "png" : "jpeg";
    return `data:image/${ext};base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

async function nacistFotky(prezentaceId: string): Promise<PhotoSet> {
  const perPrezDir = path.join(process.cwd(), "public", "photos", "prezentace", prezentaceId);
  const globalDir = path.join(process.cwd(), "public", "photos", "prezentace");
  const set: PhotoSet = {};
  for (const [key, globalFilename] of Object.entries(GLOBAL_PHOTO_FILES)) {
    let photo = await zkusitNacist(path.join(perPrezDir, `${key}.jpg`));
    if (!photo) photo = await zkusitNacist(path.join(perPrezDir, `${key}.png`));
    if (!photo) photo = await zkusitNacist(path.join(globalDir, globalFilename));
    if (photo) set[key as keyof PhotoSet] = photo;
  }
  return set;
}

async function nacistObrazek(relativni: string): Promise<string | undefined> {
  try {
    const buf = await readFile(path.join(process.cwd(), "public", relativni));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const design = url.searchParams.get("design")?.toUpperCase() === "B" ? "B" : "A";

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

  const [logoFullBase64, monogramBase64, photos] = await Promise.all([
    nacistObrazek("gp-logo-full.png"),
    nacistObrazek("gp-logo-monogram.png"),
    nacistFotky(id),
  ]);

  const buffer = await generujPptx(design, {
    data: prezentace,
    logoFullBase64,
    monogramBase64,
    photos,
  });

  const filename = `grand-padel-${slugify(prezentace.firma_nazev)}-${design.toLowerCase()}.pptx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
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
