import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { PHOTO_SLOTS, type PhotoSlot } from "@/lib/photo-prompts";

export const runtime = "nodejs";

const VALID_SLOTS = new Set(PHOTO_SLOTS.map((p) => p.slot));
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB strop pro upload (před kompresí)
const COMPRESS_MAX_W = 1920;
const COMPRESS_MAX_H = 1080;
const COMPRESS_QUALITY = 82;

async function overOpravneni(): Promise<{ ok: boolean; userId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { data: profil } = await supabase
    .from("profily")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return { ok: profil?.role === "management", userId: user.id };
}

function adresar(prezentaceId: string): string {
  return path.join(process.cwd(), "public", "photos", "prezentace", prezentaceId);
}

async function komprimovat(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate() // respektovat EXIF orientaci
    .resize({
      width: COMPRESS_MAX_W,
      height: COMPRESS_MAX_H,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: COMPRESS_QUALITY, mozjpeg: true })
    .toBuffer();
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opravneni = await overOpravneni();
  if (!opravneni.ok) {
    return NextResponse.json({ chyba: "Nemáš oprávnění" }, { status: 403 });
  }

  const formData = await req.formData();
  const slot = formData.get("slot");
  const file = formData.get("file");

  if (typeof slot !== "string" || !VALID_SLOTS.has(slot as PhotoSlot)) {
    return NextResponse.json({ chyba: "Neznámý slot" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ chyba: "Chybí soubor" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ chyba: "Soubor je větší než 10 MB" }, { status: 413 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ chyba: "Soubor není obrázek" }, { status: 400 });
  }

  const dir = adresar(id);
  await mkdir(dir, { recursive: true });

  // Vždy ukládáme jako JPEG (po kompresi). Smazat starou PNG variantu pokud existuje.
  try {
    await unlink(path.join(dir, `${slot}.png`));
  } catch {
    // ignore
  }

  const inputBuf = Buffer.from(await file.arrayBuffer());
  let outBuf: Buffer;
  try {
    outBuf = await komprimovat(inputBuf);
  } catch (e) {
    return NextResponse.json(
      { chyba: `Komprese selhala: ${e instanceof Error ? e.message : "neznámá chyba"}` },
      { status: 400 }
    );
  }

  const target = path.join(dir, `${slot}.jpg`);
  await writeFile(target, outBuf);

  return NextResponse.json({
    ok: true,
    url: `/photos/prezentace/${id}/${slot}.jpg?t=${Date.now()}`,
    originalKb: Math.round(inputBuf.length / 1024),
    kompresovanoKb: Math.round(outBuf.length / 1024),
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opravneni = await overOpravneni();
  if (!opravneni.ok) {
    return NextResponse.json({ chyba: "Nemáš oprávnění" }, { status: 403 });
  }

  const url = new URL(req.url);
  const slot = url.searchParams.get("slot");
  if (!slot || !VALID_SLOTS.has(slot as PhotoSlot)) {
    return NextResponse.json({ chyba: "Neznámý slot" }, { status: 400 });
  }

  const dir = adresar(id);
  let smazano = false;
  for (const ext of ["jpg", "png"]) {
    try {
      await unlink(path.join(dir, `${slot}.${ext}`));
      smazano = true;
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ ok: true, smazano });
}
