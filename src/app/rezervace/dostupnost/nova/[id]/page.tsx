import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import Navbar, { NAV_LINKS } from "@/components/Navbar";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BRAND = "#8C1325";

export default async function PotvrzeniRezervacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!/^[0-9a-f-]{32,40}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/prihlaseni?next=${encodeURIComponent(`/rezervace/dostupnost/nova/${id}`)}`);
  }

  const { data: rez } = await supabase
    .from("rezervace")
    .select(`
      id, zacatek, konec, delka_minut, stav, uzivatel_id, vytvoreno,
      kurty:kurt_id(id, nazev, cislo, je_center),
      pobocky:pobocka_id(nazev, mesto)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!rez) notFound();
  if (rez.uzivatel_id !== user.id) {
    // RLS by to měl ošetřit, ale pro jistotu nepouštíme detail cizí rezervace.
    notFound();
  }

  const kurt = Array.isArray(rez.kurty) ? rez.kurty[0] : rez.kurty;
  const pobocka = Array.isArray(rez.pobocky) ? rez.pobocky[0] : rez.pobocky;

  const zacDate = new Date(rez.zacatek as string);
  const koncDate = new Date(rez.konec as string);
  const datumLabel = new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(zacDate);
  const casLabel = new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    minute: "2-digit",
  });
  const casOd = casLabel.format(zacDate);
  const casDo = casLabel.format(koncDate);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1" style={{ backgroundColor: "#F2EDE4" }}>
        <section className="py-16 px-4">
          <div className="max-w-xl mx-auto">
            <div className="rounded-2xl bg-white border border-zinc-200 p-8 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(22,163,74,0.12)", color: "#16a34a" }}>
                <Check size={28} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "#0A0A0A" }}>
                Rezervace potvrzena
              </h1>
              <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
                Číslo rezervace <span className="font-mono">{(rez.id as string).slice(0, 8)}</span>.
                Potvrzení na e-mail pošleme v některé z dalších fází.
              </p>

              <dl className="text-left grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm border-t border-zinc-100 pt-6">
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Kurt</dt>
                  <dd className="font-semibold mt-0.5" style={{ color: "#0A0A0A" }}>
                    {kurt?.nazev ?? "—"}
                    {kurt?.je_center && (
                      <span className="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: BRAND, color: "#fff" }}>
                        Center
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Pobočka</dt>
                  <dd className="font-semibold mt-0.5" style={{ color: "#0A0A0A" }}>
                    {pobocka?.nazev ?? `Grand Padel ${pobocka?.mesto ?? ""}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Datum</dt>
                  <dd className="font-semibold mt-0.5" style={{ color: "#0A0A0A" }}>{datumLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Čas</dt>
                  <dd className="font-semibold mt-0.5" style={{ color: "#0A0A0A" }}>{casOd} – {casDo}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Délka</dt>
                  <dd className="font-semibold mt-0.5" style={{ color: "#0A0A0A" }}>{rez.delka_minut as number} min</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Stav</dt>
                  <dd className="font-semibold mt-0.5" style={{ color: "#16a34a" }}>Potvrzená</dd>
                </div>
              </dl>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link
                  href="/rezervace/dostupnost"
                  className="flex-1 rounded-lg px-5 py-3 text-center text-sm font-semibold text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  Rezervovat další termín
                </Link>
                <Link
                  href="/"
                  className="flex-1 rounded-lg px-5 py-3 text-center text-sm font-semibold border"
                  style={{ borderColor: "#d4d4d8", color: "#3f3f46", backgroundColor: "#fff" }}
                >
                  Na úvod
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 px-4 text-sm" style={{ backgroundColor: "#0A0A0A", color: "#9ca3af" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="font-bold text-base mb-1 text-white">Grand Padel s.r.o.</p>
            <p>Nad Sokolovnou 534, 267 06 Hýskov</p>
            <p>info@grandpadel.cz · 722 918 191</p>
          </div>
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
