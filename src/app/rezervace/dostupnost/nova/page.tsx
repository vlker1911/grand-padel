import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar, { NAV_LINKS } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import {
  vypocitejVolneSloty,
  pulnocPrahaToUTC,
  formatMinuty,
  dnesPraha,
  type KurtVypocet,
  type RezervaceVypocet,
} from "@/lib/dostupnost";
import { vytvorRezervaciFormAction } from "@/lib/rezervace-actions";

export const dynamic = "force-dynamic";

const POVOLENE_DELKY = new Set([60, 90, 120, 180, 240, 300, 360]);
const BRAND = "#8C1325";

type SP = {
  kurt?: string;
  datum?: string;
  zacatek?: string;
  delka?: string;
};

export default async function NovaRezervacePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const kurtId = sp.kurt ?? "";
  const datum = sp.datum ?? "";
  const zacatekMin = Number(sp.zacatek ?? "");
  const delkaMinut = Number(sp.delka ?? "");

  // Vstupní validace — pokud parametry chybí nebo nedávají smysl, odešleme zpátky na výběr.
  const valid =
    /^[0-9a-f-]{32,40}$/i.test(kurtId) &&
    /^\d{4}-\d{2}-\d{2}$/.test(datum) &&
    POVOLENE_DELKY.has(delkaMinut) &&
    Number.isInteger(zacatekMin) &&
    zacatekMin >= 7 * 60 &&
    zacatekMin + delkaMinut <= 23 * 60 &&
    zacatekMin % 30 === 0;
  if (!valid) {
    redirect("/rezervace/dostupnost");
  }

  // Auth — neoverene posli na login s navratem zpet.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const next = `/rezervace/dostupnost/nova?kurt=${encodeURIComponent(kurtId)}&datum=${datum}&zacatek=${zacatekMin}&delka=${delkaMinut}`;
    redirect(`/prihlaseni?next=${encodeURIComponent(next)}`);
  }

  // Načti kurt + ověř že je dostupný.
  const { data: kurt } = await supabase
    .from("kurty")
    .select("id, nazev, cislo, je_center, je_aktivni, pobocka_id, pobocky:pobocka_id(mesto)")
    .eq("id", kurtId)
    .maybeSingle();
  type PobockaJoin = { mesto?: string } | { mesto?: string }[] | null;
  const pobockyRaw: PobockaJoin = (kurt as { pobocky?: PobockaJoin } | null)?.pobocky ?? null;
  const mesto = Array.isArray(pobockyRaw) ? pobockyRaw[0]?.mesto : pobockyRaw?.mesto;
  if (!kurt || !kurt.je_aktivni || mesto !== "Olomouc") {
    redirect("/rezervace/dostupnost");
  }

  // Datum +14 dní limit (re-check).
  const dnes = dnesPraha();
  const denyDopredu = Math.round((pulnocPrahaToUTC(datum) - pulnocPrahaToUTC(dnes)) / 86_400_000);
  if (denyDopredu < 0 || denyDopredu > 14) {
    redirect("/rezervace/dostupnost");
  }

  // Čerstvě spočítat dostupnost a ověřit, že slot stále existuje (jiný uživatel ho mohl mezitím vzít).
  const pulnocMs = pulnocPrahaToUTC(datum);
  const denOd = new Date(pulnocMs);
  const denDo = new Date(pulnocMs + 86_400_000);
  const { data: rezDb } = await supabase
    .from("rezervace")
    .select("kurt_id, zacatek, konec, stav")
    .eq("kurt_id", kurtId)
    .eq("stav", "potvrzena")
    .lt("zacatek", denDo.toISOString())
    .gt("konec", denOd.toISOString());
  const rezervace: RezervaceVypocet[] = (rezDb ?? []).map((r) => ({
    kurtId: r.kurt_id as string,
    zacatekMin: Math.max(0, Math.round((new Date(r.zacatek as string).getTime() - pulnocMs) / 60000)),
    konecMin:   Math.min(24 * 60, Math.round((new Date(r.konec   as string).getTime() - pulnocMs) / 60000)),
  }));
  const kurtForCalc: KurtVypocet = {
    id: kurt.id as string,
    nazev: kurt.nazev as string,
    cislo: kurt.cislo as number,
    jeCenter: !!kurt.je_center,
  };
  // eslint-disable-next-line react-hooks/purity -- server component, jednorázová evaluace pro 32h pravidlo
  const nowMin = Math.round((Date.now() - pulnocMs) / 60000);
  const sloty = vypocitejVolneSloty({
    kurty: [kurtForCalc],
    rezervace,
    delkaMinut,
    castDne: "kdykoliv",
    nowMin,
  });
  const dostupne = new Set(sloty[0]?.zacatky ?? []);
  const slotJesteVolny = dostupne.has(zacatekMin);

  // Hezky formátovaný den.
  const datumLabel = new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(pulnocMs));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1" style={{ backgroundColor: "#F2EDE4" }}>
        <section className="py-12 px-4">
          <div className="max-w-xl mx-auto">
            <Link
              href="/rezervace/dostupnost"
              className="text-sm hover:underline mb-4 inline-block"
              style={{ color: BRAND }}
            >
              ← Zpět na volné kurty
            </Link>

            <h1 className="text-2xl font-bold mb-1" style={{ color: "#0A0A0A" }}>
              Potvrdit rezervaci
            </h1>
            <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
              Zkontrolujte prosím detaily níže a potvrďte.
            </p>

            <div className="rounded-2xl bg-white border border-zinc-200 p-6 mb-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Kurt</dt>
                  <dd className="font-semibold mt-0.5" style={{ color: "#0A0A0A" }}>
                    {kurt.nazev}
                    {kurt.je_center && (
                      <span
                        className="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: BRAND, color: "#fff" }}
                      >
                        Center
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Pobočka</dt>
                  <dd className="font-semibold mt-0.5" style={{ color: "#0A0A0A" }}>Grand Padel Olomouc</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Datum</dt>
                  <dd className="font-semibold mt-0.5" style={{ color: "#0A0A0A" }}>{datumLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Čas</dt>
                  <dd className="font-semibold mt-0.5" style={{ color: "#0A0A0A" }}>
                    {formatMinuty(zacatekMin)} – {formatMinuty(zacatekMin + delkaMinut)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Délka hry</dt>
                  <dd className="font-semibold mt-0.5" style={{ color: "#0A0A0A" }}>
                    {delkaMinut} min
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "#9ca3af" }}>Hráč</dt>
                  <dd className="font-semibold mt-0.5" style={{ color: "#0A0A0A" }}>{user.email}</dd>
                </div>
              </dl>
            </div>

            {!slotJesteVolny ? (
              <div className="rounded-2xl border p-5 mb-6"
                   style={{ backgroundColor: "#fee2e2", borderColor: "#fecaca", color: "#7f1d1d" }}>
                <p className="font-semibold mb-1">Slot už není volný.</p>
                <p className="text-sm">
                  Mezi otevřením této stránky a teď ho někdo zarezervoval, nebo přestal splňovat
                  pravidla rozvrhu (např. by vznikla 30min díra). Vraťte se a vyberte jiný čas.
                </p>
              </div>
            ) : (
              <p className="text-xs mb-4" style={{ color: "#6b7280" }}>
                Cena se zatím nepočítá — bude přidána v další fázi. Storno do 24 hodin předem zdarma.
              </p>
            )}

            <form action={vytvorRezervaciFormAction} className="flex flex-col sm:flex-row gap-3">
              <input type="hidden" name="kurtId" value={kurtId} />
              <input type="hidden" name="datum" value={datum} />
              <input type="hidden" name="zacatekMin" value={zacatekMin} />
              <input type="hidden" name="delkaMinut" value={delkaMinut} />
              <Link
                href="/rezervace/dostupnost"
                className="flex-1 rounded-lg px-5 py-3 text-center text-sm font-semibold border"
                style={{ borderColor: "#d4d4d8", color: "#3f3f46", backgroundColor: "#fff" }}
              >
                Zpět
              </Link>
              <button
                type="submit"
                disabled={!slotJesteVolny}
                className="flex-1 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                style={{ backgroundColor: BRAND }}
              >
                Potvrdit rezervaci
              </button>
            </form>
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
