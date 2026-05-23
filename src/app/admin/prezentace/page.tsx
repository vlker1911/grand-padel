import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

type PrezentaceRow = {
  id: string;
  firma_nazev: string;
  firma_kontakt_email: string;
  lokalita: string;
  poslano_at: string | null;
  created_at: string;
};

const LOKALITA_LABEL: Record<string, string> = {
  olomouc: "Olomouc",
  ostrava: "Ostrava",
  praha_zlicin: "Praha Zličín",
  cela_cr: "Celá ČR",
};

export default async function PrezentaceSeznam() {
  const supabase = await createClient();
  const { data: prezentace } = await supabase
    .from("prezentace")
    .select("id, firma_nazev, firma_kontakt_email, lokalita, poslano_at, created_at")
    .order("created_at", { ascending: false })
    .returns<PrezentaceRow[]>();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-12" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs mb-1" style={{ color: "#9ca3af" }}>
                <Link href="/admin" className="hover:underline">← Admin</Link>
              </p>
              <h1 className="text-3xl font-bold" style={{ color: "#0A0A0A" }}>
                Prezentace pro partnery
              </h1>
            </div>
            <Link
              href="/admin/prezentace/nova"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "#801A28" }}
            >
              Nová prezentace
            </Link>
          </div>

          {(!prezentace || prezentace.length === 0) ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Zatím nebyla vytvořena žádná prezentace.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "#F9F7F2" }}>
                  <tr>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#6b7280" }}>Firma</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#6b7280" }}>Kontakt</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#6b7280" }}>Lokalita</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#6b7280" }}>Stav</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "#6b7280" }}>Vytvořeno</th>
                  </tr>
                </thead>
                <tbody>
                  {prezentace.map((p) => (
                    <tr key={p.id} className="border-t border-zinc-100">
                      <td className="px-4 py-3">
                        <Link href={`/admin/prezentace/${p.id}`} className="font-medium hover:underline" style={{ color: "#801A28" }}>
                          {p.firma_nazev}
                        </Link>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#6b7280" }}>{p.firma_kontakt_email}</td>
                      <td className="px-4 py-3" style={{ color: "#6b7280" }}>{LOKALITA_LABEL[p.lokalita] ?? p.lokalita}</td>
                      <td className="px-4 py-3" style={{ color: "#6b7280" }}>
                        {p.poslano_at ? "Posláno" : "Rozpracováno"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#6b7280" }}>
                        {new Date(p.created_at).toLocaleDateString("cs-CZ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <footer className="py-4 px-4 text-center text-xs" style={{ backgroundColor: "#F2EDE4", color: "#9ca3af" }}>
        v{process.env.NEXT_PUBLIC_APP_VERSION}
      </footer>
    </div>
  );
}
