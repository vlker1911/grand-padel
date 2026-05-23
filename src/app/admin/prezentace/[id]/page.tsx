import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { brand, LOKALITY, VELIKOSTI_FIRMY, TYPY_SPOLUPRACE } from "@/lib/brand";
import type { GenerovanyObsah } from "@/app/api/admin/prezentace/ulozit/route";

type Props = { params: Promise<{ id: string }> };

type PrezentaceRow = {
  id: string;
  firma_nazev: string;
  firma_kontakt_jmeno: string | null;
  firma_kontakt_pozice: string | null;
  firma_kontakt_email: string | null;
  firma_kontakt_telefon: string | null;
  firma_web: string | null;
  typy_spoluprace: string[];
  lokalita: string;
  velikost_firmy: string;
  bez_cen: boolean;
  dodatecne_info: string | null;
  generovany_obsah: GenerovanyObsah | null;
  sdileny_token: string | null;
  poslano_at: string | null;
  created_at: string;
};

export default async function DetailPrezentace({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: prezentace } = await supabase
    .from("prezentace")
    .select("*")
    .eq("id", id)
    .maybeSingle<PrezentaceRow>();

  if (!prezentace) notFound();

  const lokalita = LOKALITY.find((l) => l.value === prezentace.lokalita)?.label ?? prezentace.lokalita;
  const velikost = VELIKOSTI_FIRMY.find((v) => v.value === prezentace.velikost_firmy)?.label ?? prezentace.velikost_firmy;
  const typy = prezentace.typy_spoluprace
    .map((t) => TYPY_SPOLUPRACE.find((tt) => tt.value === t)?.label ?? t)
    .join(", ");

  const obsah = prezentace.generovany_obsah;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-12" style={{ backgroundColor: brand.colors.cream }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs mb-1" style={{ color: "#9ca3af" }}>
            <Link href="/admin/prezentace" className="hover:underline">← Prezentace</Link>
          </p>
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: brand.colors.black }}>
                {prezentace.firma_nazev}
              </h1>
              <p className="text-sm" style={{ color: brand.colors.muted }}>
                {typy} · {lokalita} · {velikost}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <a
                href={`/api/admin/prezentace/${prezentace.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap"
                style={{ backgroundColor: brand.colors.red }}
              >
                Stáhnout PDF
              </a>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: brand.colors.muted }}>
              Zadání
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {prezentace.firma_kontakt_jmeno && (
                <Metaradek label="Kontakt" value={`${prezentace.firma_kontakt_jmeno}${prezentace.firma_kontakt_pozice ? ` (${prezentace.firma_kontakt_pozice})` : ""}`} />
              )}
              {prezentace.firma_kontakt_email && (
                <Metaradek label="E-mail" value={prezentace.firma_kontakt_email} />
              )}
              {prezentace.firma_kontakt_telefon && (
                <Metaradek label="Telefon" value={prezentace.firma_kontakt_telefon} />
              )}
              {prezentace.firma_web && (
                <Metaradek label="Web" value={prezentace.firma_web} />
              )}
              <Metaradek label="Ceny" value={prezentace.bez_cen ? "Bez cen" : "S balíčky"} />
              <Metaradek label="Vytvořeno" value={new Date(prezentace.created_at).toLocaleString("cs-CZ")} />
            </dl>
            {prezentace.dodatecne_info && (
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <div className="text-xs uppercase font-medium mb-1" style={{ color: brand.colors.muted }}>
                  Kontext pro AI
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: brand.colors.black }}>
                  {prezentace.dodatecne_info}
                </p>
              </div>
            )}
          </div>

          {/* Generovaný obsah */}
          {obsah && (
            <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
              <Sekce nadpis="Úvod">
                <p className="whitespace-pre-wrap" style={{ color: brand.colors.black }}>{obsah.uvod}</p>
              </Sekce>

              <Sekce nadpis="Hodnota pro partnera">
                <ul className="space-y-2">
                  {obsah.hodnota.map((h, i) => (
                    <li key={i} className="flex gap-3">
                      <span style={{ color: brand.colors.red }}>▸</span>
                      <span style={{ color: brand.colors.black }}>{h}</span>
                    </li>
                  ))}
                </ul>
              </Sekce>

              <Sekce nadpis="Konkrétní návrhy">
                <ul className="space-y-2">
                  {obsah.konkretni_navrhy.map((n, i) => (
                    <li key={i} className="flex gap-3">
                      <span style={{ color: brand.colors.red }}>▸</span>
                      <span style={{ color: brand.colors.black }}>{n}</span>
                    </li>
                  ))}
                </ul>
              </Sekce>

              {obsah.cenove_balicky.length > 0 && (
                <Sekce nadpis="Cenové balíčky">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {obsah.cenove_balicky.map((b, i) => (
                      <div key={i} className="rounded-xl border border-zinc-200 p-4">
                        <div className="font-semibold mb-1" style={{ color: brand.colors.red }}>{b.nazev}</div>
                        <div className="text-sm mb-2" style={{ color: brand.colors.black }}>{b.popis}</div>
                        <div className="text-sm font-medium" style={{ color: brand.colors.black }}>
                          {b.cena_min.toLocaleString("cs-CZ")} – {b.cena_max.toLocaleString("cs-CZ")} Kč
                        </div>
                        <div className="text-xs mt-1" style={{ color: brand.colors.muted }}>
                          Vhodné pro: {b.vhodne_pro}
                        </div>
                      </div>
                    ))}
                  </div>
                </Sekce>
              )}

              {prezentace.bez_cen && (
                <Sekce nadpis="Cenové balíčky">
                  <p className="italic" style={{ color: brand.colors.muted }}>
                    Konkrétní nabídku zpracujeme po úvodním setkání.
                  </p>
                </Sekce>
              )}

              <Sekce nadpis="Výzva k akci">
                <p style={{ color: brand.colors.black }}>{obsah.call_to_action}</p>
              </Sekce>

              {obsah.dodatecne_info && (
                <Sekce nadpis="Poznámka">
                  <p className="text-sm" style={{ color: brand.colors.muted }}>{obsah.dodatecne_info}</p>
                </Sekce>
              )}
            </div>
          )}

          {!obsah && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <p className="text-sm" style={{ color: brand.colors.muted }}>
                Tato prezentace nemá uložený AI obsah.
              </p>
            </div>
          )}

          <p className="text-xs text-center mt-8" style={{ color: brand.colors.muted }}>
            PDF/PPTX export a tracking přijde v dalších krocích vývoje.
          </p>
        </div>
      </main>
      <footer className="py-4 px-4 text-center text-xs" style={{ backgroundColor: brand.colors.cream, color: "#9ca3af" }}>
        v{process.env.NEXT_PUBLIC_APP_VERSION}
      </footer>
    </div>
  );
}

function Metaradek({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase font-medium mb-0.5" style={{ color: brand.colors.muted }}>{label}</div>
      <div style={{ color: brand.colors.black }}>{value}</div>
    </div>
  );
}

function Sekce({ nadpis, children }: { nadpis: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs uppercase tracking-wide font-semibold mb-3" style={{ color: brand.colors.muted }}>
        {nadpis}
      </h2>
      {children}
    </div>
  );
}
