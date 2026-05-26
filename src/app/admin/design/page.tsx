import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { getActiveDesign } from "@/lib/get-design";
import { setActiveDesign } from "./actions";

export const metadata = {
  title: "Design webu â€” Admin",
};

type HistoryRow = {
  id: string;
  design: "A" | "B";
  zmeneno_at: string;
  zmenil: string | null;
};

export default async function AdminDesignPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const sp = await searchParams;
  const active = await getActiveDesign();

  const supabase = await createClient();
  const { data: history } = await supabase
    .from("web_settings_history")
    .select("id, design, zmeneno_at, zmenil")
    .order("zmeneno_at", { ascending: false })
    .limit(20);

  const rows: HistoryRow[] = history ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/admin" className="text-sm hover:underline" style={{ color: "var(--brand)" }}>
              â† Admin
            </Link>
            <h1 className="text-3xl font-bold mt-2" style={{ color: "var(--text-primary)" }}>Design webu</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              GlobĂˇlnĂ­ vizuĂˇlnĂ­ styl pro celĂ˝ web. ZmÄ›na platĂ­ pro vĹˇechny nĂˇvĹˇtÄ›vnĂ­ky.
            </p>
          </div>

          {sp.ok && (
            <div
              className="rounded-xl px-4 py-3 mb-6 text-sm"
              style={{ backgroundColor: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" }}
            >
              Design uloĹľen. AktivnĂ­ je nynĂ­ <strong>Design {active}</strong>.
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            <DesignCard
              variant="A"
              active={active === "A"}
              title="Design A â€” svÄ›tlĂ˝"
              subtitle="BĂ­lĂ© pozadĂ­, bordĂł akcenty, krĂ©movĂ© sekce. KlasickĂ˝ klubovĂ˝ web."
              previewBg="#FFFFFF"
              previewAccent="#8C1325"
              previewSection="#F2EDE4"
              previewText="#0A0A0A"
            />
            <DesignCard
              variant="B"
              active={active === "B"}
              title="Design B â€” bordĂł-dominantnĂ­"
              subtitle="BordĂł pozadĂ­, bĂ­lĂ˝ text, GP monogram. Z PDF prezentace pro partnery."
              previewBg="#8C1325"
              previewAccent="#FFFFFF"
              previewSection="#8C1325"
              previewText="#FFFFFF"
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/?design=A"
              target="_blank"
              className="rounded-full px-5 py-2 text-sm font-semibold transition-colors"
              style={{ color: "var(--brand)", border: "1px solid var(--brand)" }}
            >
              NĂˇhled A v novĂ©m tabu
            </Link>
            <Link
              href="/?design=B"
              target="_blank"
              className="rounded-full px-5 py-2 text-sm font-semibold transition-colors"
              style={{ color: "var(--brand)", border: "1px solid var(--brand)" }}
            >
              NĂˇhled B v novĂ©m tabu
            </Link>
          </div>

          {/* Audit log */}
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Historie zmÄ›n</h2>
            {rows.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>ZatĂ­m ĹľĂˇdnĂ© zmÄ›ny.</p>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                      <th className="text-left px-4 py-3 font-semibold">Kdy</th>
                      <th className="text-left px-4 py-3 font-semibold">Design</th>
                      <th className="text-left px-4 py-3 font-semibold">Kdo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                          {new Date(r.zmeneno_at).toLocaleString("cs-CZ")}
                        </td>
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--brand)" }}>{r.design}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{r.zmenil ?? "â€”"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="py-4 px-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        v{process.env.NEXT_PUBLIC_APP_VERSION}
      </footer>
    </div>
  );
}

function DesignCard({
  variant,
  active,
  title,
  subtitle,
  previewBg,
  previewAccent,
  previewSection,
  previewText,
}: {
  variant: "A" | "B";
  active: boolean;
  title: string;
  subtitle: string;
  previewBg: string;
  previewAccent: string;
  previewSection: string;
  previewText: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: "var(--bg-card)",
        border: active ? "2px solid var(--brand)" : "1px solid var(--border-subtle)",
      }}
    >
      {/* Mini preview */}
      <div className="h-40 relative" style={{ backgroundColor: previewBg }}>
        <div className="absolute inset-0 flex flex-col">
          <div className="h-8" style={{ backgroundColor: previewAccent }} />
          <div className="flex-1 p-4 flex flex-col gap-2">
            <div className="h-3 w-2/3 rounded" style={{ backgroundColor: previewText, opacity: 0.85 }} />
            <div className="h-2 w-1/2 rounded" style={{ backgroundColor: previewText, opacity: 0.45 }} />
            <div className="mt-auto h-10 rounded" style={{ backgroundColor: previewSection }} />
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
          {active && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--brand)", color: "var(--brand-contrast)" }}
            >
              aktivnĂ­
            </span>
          )}
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>

        <form action={setActiveDesign}>
          <input type="hidden" name="design" value={variant} />
          <button
            type="submit"
            disabled={active}
            className="rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--brand-red)", color: "var(--brand-white)" }}
          >
            {active ? "AktivnĂ­" : `Aktivovat Design ${variant}`}
          </button>
        </form>
      </div>
    </div>
  );
}
