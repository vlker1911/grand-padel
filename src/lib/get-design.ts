import { unstable_cache, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { BrandDesign } from "@/lib/brand";

export const DESIGN_PREVIEW_COOKIE = "gp_design_preview";

/**
 * Globální aktivní design webu — čte se z public.web_settings (singleton id=1).
 * Cachuje se 60 s pomocí Next.js cache, klíč/tag = "web-settings".
 * Po změně designu z admina volej revalidateWebSettings() (viz dole).
 *
 * Pozn.: NEpoužívá cookie-vázaný @supabase/ssr klienta — řádek je veřejný (RLS
 * povoluje SELECT pro anon) a cookies() uvnitř unstable_cache by házelo.
 */
const WEB_SETTINGS_TAG = "web-settings";

const fetchActiveDesign = unstable_cache(
  async (): Promise<BrandDesign> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return "A";

    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("web_settings")
      .select("active_design")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return "A";
    return data.active_design === "B" ? "B" : "A";
  },
  ["web-settings:active-design"],
  { revalidate: 60, tags: [WEB_SETTINGS_TAG] }
);

/**
 * Vrátí aktivní design pro daný request.
 * Pokud je v URL ?design=A nebo ?design=B, override-ne globální nastavení
 * (slouží k náhledu před aktivací). Jinak vrací globální hodnotu z DB.
 */
export async function getActiveDesign(
  searchParams?: { design?: string | string[] } | URLSearchParams | null
): Promise<BrandDesign> {
  // Priorita: URL searchParams (jen kdyby je někdo předal explicitně) → cookie preview → DB
  const fromParam = readDesignOverride(searchParams);
  if (fromParam) return fromParam;

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(DESIGN_PREVIEW_COOKIE)?.value;
  if (fromCookie === "A" || fromCookie === "B") return fromCookie;

  return fetchActiveDesign();
}

export function readDesignOverride(
  searchParams?: { design?: string | string[] } | URLSearchParams | null
): BrandDesign | null {
  if (!searchParams) return null;
  const raw =
    searchParams instanceof URLSearchParams
      ? searchParams.get("design")
      : Array.isArray(searchParams.design)
      ? searchParams.design[0]
      : searchParams.design;
  if (raw === "A" || raw === "a") return "A";
  if (raw === "B" || raw === "b") return "B";
  return null;
}

/** Zavolej po UPDATE web_settings v admin Server Action. */
export function revalidateWebSettings() {
  revalidateTag(WEB_SETTINGS_TAG);
}
