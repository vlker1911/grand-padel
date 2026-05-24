"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  brand,
  TYPY_SPOLUPRACE,
  LOKALITY,
  VELIKOSTI_FIRMY,
  type TypSpoluprace,
  type Lokalita,
  type VelikostFirmy,
} from "@/lib/brand";
import type { Balicek, GenerovanyObsah } from "@/app/api/admin/prezentace/ulozit/route";

type Krok = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type FormData = {
  firmaNazev: string;
  firmaKontaktJmeno: string;
  firmaKontaktPozice: string;
  firmaKontaktEmail: string;
  firmaKontaktTelefon: string;
  firmaWeb: string;
  firmaBarva: string;
  firmaBarvaSekundarni: string;
  typySpoluprace: TypSpoluprace[];
  lokalita: Lokalita | "";
  velikostFirmy: VelikostFirmy | "";
  bezCen: boolean;
  dodatecneInfo: string;
};

const VYCHOZI_DATA: FormData = {
  firmaNazev: "",
  firmaKontaktJmeno: "",
  firmaKontaktPozice: "",
  firmaKontaktEmail: "",
  firmaKontaktTelefon: "",
  firmaWeb: "",
  firmaBarva: "",
  firmaBarvaSekundarni: "",
  typySpoluprace: [],
  lokalita: "",
  velikostFirmy: "",
  bezCen: false,
  dodatecneInfo: "",
};

const PRAZDNY_OBSAH: GenerovanyObsah = {
  uvod: "",
  hodnota: [],
  konkretni_navrhy: [],
  cenove_balicky: [],
  call_to_action: "",
  dodatecne_info: "",
};

const NAZVY_KROKU: Record<Krok, string> = {
  1: "Typ spolupráce",
  2: "Lokalita",
  3: "Velikost firmy",
  4: "Firma a kontakt",
  5: "Nastavení cen",
  6: "Doplňující informace",
  7: "Obsah prezentace",
};

export default function NovaPrezentace() {
  const router = useRouter();
  const [krok, setKrok] = useState<Krok>(1);
  const [data, setData] = useState<FormData>(VYCHOZI_DATA);
  const [obsah, setObsah] = useState<GenerovanyObsah>(PRAZDNY_OBSAH);
  const [uklada, setUklada] = useState(false);
  const [chyba, setChyba] = useState<string | null>(null);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function toggleTyp(typ: TypSpoluprace) {
    setData((d) => ({
      ...d,
      typySpoluprace: d.typySpoluprace.includes(typ)
        ? d.typySpoluprace.filter((t) => t !== typ)
        : [...d.typySpoluprace, typ],
    }));
  }

  function muzeDal(): boolean {
    switch (krok) {
      case 1:
        return data.typySpoluprace.length > 0;
      case 2:
        return data.lokalita !== "";
      case 3:
        return data.velikostFirmy !== "";
      case 4:
        return data.firmaNazev.trim() !== "";
      case 5:
      case 6:
      case 7:
        return true;
    }
  }

  function dalsi() {
    if (krok < 7 && muzeDal()) setKrok((k) => (k + 1) as Krok);
  }

  function zpet() {
    if (krok > 1) setKrok((k) => (k - 1) as Krok);
  }

  async function ulozit() {
    setUklada(true);
    setChyba(null);
    try {
      const r = await fetch("/api/admin/prezentace/ulozit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, obsah }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.chyba ?? "Neznámá chyba");
      router.push(`/admin/prezentace/${json.id}`);
    } catch (e) {
      setChyba(e instanceof Error ? e.message : "Neznámá chyba");
      setUklada(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-12" style={{ backgroundColor: brand.colors.cream }}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <p className="text-xs mb-1" style={{ color: "#9ca3af" }}>
              <Link href="/admin/prezentace" className="hover:underline">← Prezentace</Link>
            </p>
            <h1 className="text-3xl font-bold" style={{ color: brand.colors.black }}>
              Nová prezentace
            </h1>
          </div>

          <KrokIndikator aktualni={krok} />

          <div className="bg-white rounded-2xl shadow-sm p-8 mt-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: brand.colors.red }}>
              {krok}. {NAZVY_KROKU[krok]}
            </h2>

            {krok === 1 && <KrokTypSpoluprace vybrane={data.typySpoluprace} toggle={toggleTyp} />}
            {krok === 2 && <KrokLokalita vybrana={data.lokalita} vyber={(v) => update("lokalita", v)} />}
            {krok === 3 && <KrokVelikost vybrana={data.velikostFirmy} vyber={(v) => update("velikostFirmy", v)} />}
            {krok === 4 && <KrokFirma data={data} update={update} />}
            {krok === 5 && <Krok5 bezCen={data.bezCen} toggle={() => update("bezCen", !data.bezCen)} />}
            {krok === 6 && <Krok6 text={data.dodatecneInfo} update={(v) => update("dodatecneInfo", v)} />}
            {krok === 7 && <KrokObsah data={data} obsah={obsah} setObsah={setObsah} />}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100">
              <button
                type="button"
                onClick={zpet}
                disabled={krok === 1}
                className="rounded-full px-5 py-2.5 text-sm font-semibold border border-zinc-200 disabled:opacity-40"
                style={{ color: brand.colors.muted }}
              >
                ← Zpět
              </button>

              {krok < 7 ? (
                <button
                  type="button"
                  onClick={dalsi}
                  disabled={!muzeDal()}
                  className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: brand.colors.red }}
                >
                  Pokračovat →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={ulozit}
                  disabled={uklada}
                  className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: brand.colors.red }}
                >
                  {uklada ? "Ukládám…" : "Uložit prezentaci"}
                </button>
              )}
            </div>
            {chyba && (
              <p className="text-sm mt-4 text-center" style={{ color: brand.colors.red }}>
                {chyba}
              </p>
            )}
          </div>
        </div>
      </main>
      <footer className="py-4 px-4 text-center text-xs" style={{ backgroundColor: brand.colors.cream, color: "#9ca3af" }}>
        v{process.env.NEXT_PUBLIC_APP_VERSION}
      </footer>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
function KrokIndikator({ aktualni }: { aktualni: Krok }) {
  return (
    <div className="flex items-center gap-1">
      {([1, 2, 3, 4, 5, 6, 7] as Krok[]).map((k) => (
        <div
          key={k}
          className="flex-1 h-1.5 rounded-full transition-colors"
          style={{ backgroundColor: k <= aktualni ? brand.colors.red : "#E5E3DE" }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// KROK 1 — Typ spolupráce (multi)
function KrokTypSpoluprace({ vybrane, toggle }: { vybrane: TypSpoluprace[]; toggle: (t: TypSpoluprace) => void; }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: brand.colors.muted }}>Můžeš zaškrtnout více možností.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {TYPY_SPOLUPRACE.map((typ) => {
          const aktivni = vybrane.includes(typ.value);
          return (
            <button
              key={typ.value}
              type="button"
              onClick={() => toggle(typ.value)}
              className="text-left rounded-xl border-2 p-4 transition-all"
              style={{ borderColor: aktivni ? brand.colors.red : "#E5E3DE", backgroundColor: aktivni ? "#FBF1F2" : "white" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center"
                  style={{ borderColor: aktivni ? brand.colors.red : "#cbd5e1", backgroundColor: aktivni ? brand.colors.red : "white" }}>
                  {aktivni && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6.5L4.5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="font-medium text-sm" style={{ color: brand.colors.black }}>{typ.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// KROK 2 — Lokalita
function KrokLokalita({ vybrana, vyber }: { vybrana: Lokalita | ""; vyber: (v: Lokalita) => void; }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {LOKALITY.map((lok) => {
        const aktivni = vybrana === lok.value;
        return (
          <button
            key={lok.value}
            type="button"
            onClick={() => vyber(lok.value)}
            className="text-left rounded-xl border-2 p-4 transition-all"
            style={{ borderColor: aktivni ? brand.colors.red : "#E5E3DE", backgroundColor: aktivni ? "#FBF1F2" : "white" }}
          >
            <div className="font-semibold text-sm" style={{ color: brand.colors.black }}>{lok.label}</div>
            <div className="text-xs mt-1" style={{ color: brand.colors.muted }}>{lok.podtitul}</div>
          </button>
        );
      })}
    </div>
  );
}

// KROK 3 — Velikost
function KrokVelikost({ vybrana, vyber }: { vybrana: VelikostFirmy | ""; vyber: (v: VelikostFirmy) => void; }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {VELIKOSTI_FIRMY.map((vel) => {
        const aktivni = vybrana === vel.value;
        return (
          <button
            key={vel.value}
            type="button"
            onClick={() => vyber(vel.value)}
            className="text-left rounded-xl border-2 p-4 transition-all"
            style={{ borderColor: aktivni ? brand.colors.red : "#E5E3DE", backgroundColor: aktivni ? "#FBF1F2" : "white" }}
          >
            <div className="font-semibold text-sm" style={{ color: brand.colors.black }}>{vel.label}</div>
            <div className="text-xs mt-1" style={{ color: brand.colors.muted }}>{vel.podtitul}</div>
          </button>
        );
      })}
    </div>
  );
}

// KROK 4 — Firma
function KrokFirma({ data, update }: { data: FormData; update: <K extends keyof FormData>(key: K, value: FormData[K]) => void; }) {
  return (
    <div className="flex flex-col gap-4">
      <Input label="Název firmy *" value={data.firmaNazev} onChange={(v) => update("firmaNazev", v)} placeholder="Alza" hint="Jediné povinné pole. Kontakt můžeš doplnit později." />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Kontaktní osoba — jméno" value={data.firmaKontaktJmeno} onChange={(v) => update("firmaKontaktJmeno", v)} placeholder="Jan Novák" />
        <Input label="Pozice" value={data.firmaKontaktPozice} onChange={(v) => update("firmaKontaktPozice", v)} placeholder="Marketing manager" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="E-mail" type="email" value={data.firmaKontaktEmail} onChange={(v) => update("firmaKontaktEmail", v)} placeholder="jan.novak@firma.cz" />
        <Input label="Telefon" value={data.firmaKontaktTelefon} onChange={(v) => update("firmaKontaktTelefon", v)} placeholder="+420 ..." />
      </div>
      <Input label="Web firmy" value={data.firmaWeb} onChange={(v) => update("firmaWeb", v)} placeholder="https://firma.cz" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Primární brand barva"
          value={data.firmaBarva}
          onChange={(v) => update("firmaBarva", v)}
          placeholder="žlutá #F9D71C"
          hint="Hlavní brand prvky (mřížka, sloupky vstupu)."
        />
        <Input
          label="Sekundární barva (volitelné)"
          value={data.firmaBarvaSekundarni}
          onChange={(v) => update("firmaBarvaSekundarni", v)}
          placeholder="zelená #7AB800"
          hint="Akcent (páska na síti)."
        />
      </div>
    </div>
  );
}

// KROK 5 — Ceny
function Krok5({ bezCen, toggle }: { bezCen: boolean; toggle: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={toggle}
        className="text-left rounded-xl border-2 p-4 transition-all"
        style={{ borderColor: bezCen ? brand.colors.red : "#E5E3DE", backgroundColor: bezCen ? "#FBF1F2" : "white" }}
      >
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 flex-shrink-0"
            style={{ borderColor: bezCen ? brand.colors.red : "#cbd5e1", backgroundColor: bezCen ? brand.colors.red : "white" }}>
            {bezCen && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6.5L4.5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: brand.colors.black }}>Bez cen v prezentaci</div>
            <div className="text-xs mt-1" style={{ color: brand.colors.muted }}>
              Místo balíčků se uvede „Konkrétní nabídku zpracujeme po úvodním setkání.“
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

// KROK 6 — Kontext pro AI
function Krok6({ text, update }: { text: string; update: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium" style={{ color: "#374151" }}>Kontext pro AI</label>
      <textarea
        value={text}
        onChange={(e) => update(e.target.value)}
        rows={6}
        placeholder='Např. "Viděli jsme se na konferenci HR Days, mluvili jsme o teambuildingu pro 300 lidí."'
        className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2"
        style={{ outlineColor: brand.colors.red }}
      />
      <p className="text-xs" style={{ color: brand.colors.muted }}>
        Volitelné. Propíše se do promptu pro AI a zlepší personalizaci.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// KROK 7 — Promptovací & vyplňovací obrazovka
// ──────────────────────────────────────────────────────────
function KrokObsah({
  data,
  obsah,
  setObsah,
}: {
  data: FormData;
  obsah: GenerovanyObsah;
  setObsah: (o: GenerovanyObsah) => void;
}) {
  const [jsonText, setJsonText] = useState("");
  const [chybaParse, setChybaParse] = useState<string | null>(null);
  const [zkopirovano, setZkopirovano] = useState(false);

  const prompt = useMemo(() => sestavitPrompt(data), [data]);

  async function kopirovatPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setZkopirovano(true);
      setTimeout(() => setZkopirovano(false), 2000);
    } catch {
      setChybaParse("Kopírování selhalo. Označ text ručně a zkopíruj.");
    }
  }

  function nacistOdpoved() {
    setChybaParse(null);
    try {
      const cleaned = vyrizniJson(jsonText);
      const parsed = JSON.parse(cleaned);

      const novy: GenerovanyObsah = {
        uvod: String(parsed.uvod ?? ""),
        hodnota: Array.isArray(parsed.hodnota) ? parsed.hodnota.map(String) : [],
        konkretni_navrhy: Array.isArray(parsed.konkretni_navrhy) ? parsed.konkretni_navrhy.map(String) : [],
        cenove_balicky: Array.isArray(parsed.cenove_balicky)
          ? parsed.cenove_balicky.map((b: Partial<Balicek>) => ({
              nazev: String(b.nazev ?? ""),
              popis: String(b.popis ?? ""),
              cena_min: Number(b.cena_min ?? 0),
              cena_max: Number(b.cena_max ?? 0),
              vhodne_pro: String(b.vhodne_pro ?? ""),
            }))
          : [],
        call_to_action: String(parsed.call_to_action ?? ""),
        dodatecne_info: String(parsed.dodatecne_info ?? ""),
      };
      setObsah(novy);
    } catch (e) {
      setChybaParse(
        e instanceof Error ? `Chyba: ${e.message}` : "Vlož validní JSON od AI."
      );
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Souhrn zadání */}
      <details className="rounded-xl border border-zinc-200 p-4">
        <summary className="text-sm font-medium cursor-pointer" style={{ color: brand.colors.muted }}>
          Zobrazit souhrn zadání
        </summary>
        <SouhrnZadani data={data} />
      </details>

      {/* Sekce: Prompt */}
      <Sekce nadpis="1. Zkopíruj prompt do Claude.ai (nebo jiného AI nástroje)">
        <textarea
          value={prompt}
          readOnly
          rows={8}
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs font-mono bg-zinc-50"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={kopirovatPrompt}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: brand.colors.red }}
          >
            {zkopirovano ? "✓ Zkopírováno" : "Kopírovat prompt"}
          </button>
          <a
            href="https://claude.ai/new"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium hover:underline"
            style={{ color: brand.colors.red }}
          >
            Otevřít Claude.ai →
          </a>
        </div>
      </Sekce>

      {/* Sekce: Vlož odpověď */}
      <Sekce nadpis="2. Vlož JSON odpověď od AI">
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={6}
          placeholder='{"uvod": "...", "hodnota": [...], ...}'
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs font-mono"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={nacistOdpoved}
            disabled={jsonText.trim() === ""}
            className="rounded-full px-5 py-2 text-sm font-semibold border-2 disabled:opacity-40"
            style={{ borderColor: brand.colors.red, color: brand.colors.red }}
          >
            Načíst do polí ↓
          </button>
          {chybaParse && (
            <span className="text-xs" style={{ color: brand.colors.red }}>{chybaParse}</span>
          )}
        </div>
      </Sekce>

      {/* Sekce: Editace */}
      <Sekce nadpis="3. Zkontroluj a uprav (nebo napiš ručně)">
        <div className="flex flex-col gap-5">
          <PoleTextarea
            label="Úvod"
            value={obsah.uvod}
            onChange={(v) => setObsah({ ...obsah, uvod: v })}
            rows={3}
            placeholder="Personalizovaný úvod, 2–3 věty"
          />

          <PoleSeznam
            label="Hodnota pro partnera"
            polozky={obsah.hodnota}
            onChange={(v) => setObsah({ ...obsah, hodnota: v })}
            hint="Jeden bod na řádek. 3–5 bodů."
          />

          <PoleSeznam
            label="Konkrétní návrhy"
            polozky={obsah.konkretni_navrhy}
            onChange={(v) => setObsah({ ...obsah, konkretni_navrhy: v })}
            hint="Jeden bod na řádek. 3–5 bodů."
          />

          {!data.bezCen && (
            <PoleBalicky
              balicky={obsah.cenove_balicky}
              onChange={(v) => setObsah({ ...obsah, cenove_balicky: v })}
            />
          )}

          {data.bezCen && (
            <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm italic" style={{ color: brand.colors.muted }}>
              Balíčky se nezadávají — v prezentaci bude „Konkrétní nabídku zpracujeme po úvodním setkání.“
            </div>
          )}

          <PoleTextarea
            label="Výzva k akci"
            value={obsah.call_to_action}
            onChange={(v) => setObsah({ ...obsah, call_to_action: v })}
            rows={2}
            placeholder="Návrh dalšího kroku, 1–2 věty"
          />

          <PoleTextarea
            label="Poznámka pod čarou"
            value={obsah.dodatecne_info}
            onChange={(v) => setObsah({ ...obsah, dodatecne_info: v })}
            rows={2}
            placeholder="Volitelná dodatečná informace v patičce"
          />
        </div>
      </Sekce>
    </div>
  );
}

function SouhrnZadani({ data }: { data: FormData }) {
  const typy = data.typySpoluprace.map((t) => TYPY_SPOLUPRACE.find((tt) => tt.value === t)?.label).filter(Boolean).join(", ");
  const lok = LOKALITY.find((l) => l.value === data.lokalita)?.label ?? "—";
  const vel = VELIKOSTI_FIRMY.find((v) => v.value === data.velikostFirmy)?.label ?? "—";
  return (
    <dl className="grid sm:grid-cols-2 gap-2 text-sm mt-3" style={{ color: brand.colors.muted }}>
      <div><span className="font-medium">Firma:</span> {data.firmaNazev}</div>
      <div><span className="font-medium">Typ:</span> {typy}</div>
      <div><span className="font-medium">Lokalita:</span> {lok}</div>
      <div><span className="font-medium">Velikost:</span> {vel}</div>
      <div><span className="font-medium">Ceny:</span> {data.bezCen ? "Bez cen" : "S balíčky"}</div>
    </dl>
  );
}

// ──────────────────────────────────────────────────────────
// Pole pro editaci
// ──────────────────────────────────────────────────────────
function PoleTextarea({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: "#374151" }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
      />
    </div>
  );
}

function PoleSeznam({
  label,
  polozky,
  onChange,
  hint,
}: {
  label: string;
  polozky: string[];
  onChange: (v: string[]) => void;
  hint?: string;
}) {
  const text = polozky.join("\n");
  function set(v: string) {
    onChange(v.split("\n").map((s) => s.trimEnd()).filter((s, i, arr) => s !== "" || i < arr.length - 1));
  }
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: "#374151" }}>{label}</label>
      <textarea
        value={text}
        onChange={(e) => set(e.target.value)}
        rows={Math.max(4, polozky.length + 1)}
        placeholder="Bod 1&#10;Bod 2&#10;Bod 3"
        className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
      />
      {hint && <p className="text-xs" style={{ color: brand.colors.muted }}>{hint}</p>}
    </div>
  );
}

function PoleBalicky({
  balicky,
  onChange,
}: {
  balicky: Balicek[];
  onChange: (v: Balicek[]) => void;
}) {
  function pridat() {
    onChange([...balicky, { nazev: "", popis: "", cena_min: 0, cena_max: 0, vhodne_pro: "" }]);
  }
  function smazat(i: number) {
    onChange(balicky.filter((_, idx) => idx !== i));
  }
  function upravit(i: number, b: Balicek) {
    onChange(balicky.map((x, idx) => (idx === i ? b : x)));
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium" style={{ color: "#374151" }}>Cenové balíčky</label>
      {balicky.map((b, i) => (
        <div key={i} className="rounded-xl border border-zinc-200 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: brand.colors.muted }}>Balíček {i + 1}</span>
            <button type="button" onClick={() => smazat(i)} className="text-xs hover:underline" style={{ color: brand.colors.red }}>
              Smazat
            </button>
          </div>
          <Input label="Název" value={b.nazev} onChange={(v) => upravit(i, { ...b, nazev: v })} placeholder="Bronze / Silver / Gold" />
          <PoleTextarea label="Popis" value={b.popis} onChange={(v) => upravit(i, { ...b, popis: v })} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cena od (Kč)"
              type="number"
              value={String(b.cena_min)}
              onChange={(v) => upravit(i, { ...b, cena_min: Number(v) || 0 })}
            />
            <Input
              label="Cena do (Kč)"
              type="number"
              value={String(b.cena_max)}
              onChange={(v) => upravit(i, { ...b, cena_max: Number(v) || 0 })}
            />
          </div>
          <Input label="Vhodné pro" value={b.vhodne_pro} onChange={(v) => upravit(i, { ...b, vhodne_pro: v })} placeholder="Středně velké firmy …" />
        </div>
      ))}
      <button
        type="button"
        onClick={pridat}
        className="self-start rounded-full px-4 py-2 text-sm font-semibold border-2"
        style={{ borderColor: brand.colors.red, color: brand.colors.red }}
      >
        + Přidat balíček
      </button>
    </div>
  );
}

function Sekce({ nadpis, children }: { nadpis: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: brand.colors.black }}>{nadpis}</h3>
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Input helper
// ──────────────────────────────────────────────────────────
function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: "#374151" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2"
        style={{ outlineColor: brand.colors.red }}
      />
      {hint && <p className="text-xs" style={{ color: brand.colors.muted }}>{hint}</p>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Helper: sestavení promptu a parsování odpovědi
// ──────────────────────────────────────────────────────────
function sestavitPrompt(d: FormData): string {
  const typy = d.typySpoluprace.map((t) => TYPY_SPOLUPRACE.find((tt) => tt.value === t)?.label).filter(Boolean).join(", ");
  const lok = LOKALITY.find((l) => l.value === d.lokalita)?.label ?? d.lokalita;
  const vel = VELIKOSTI_FIRMY.find((v) => v.value === d.velikostFirmy)?.label ?? d.velikostFirmy;

  const kontakt = d.firmaKontaktJmeno
    ? `${d.firmaKontaktJmeno}${d.firmaKontaktPozice ? ` (${d.firmaKontaktPozice})` : ""}`
    : "neznámý / obecná prezentace pro firmu";

  return `Jsi expert na B2B prodej a content marketing pro Grand Padel — síť indoor padel center otevírající se v České republice v roce 2026.

# O Grand Padelu
- Síť moderních indoor padel center
- Otevření: Olomouc (říjen 2026), Ostrava (prosinec 2026), Praha Zličín (únor–březen 2027)
- Každá hala má vždy CENTER kurt (prémiový vlajkový kurt)
- Pre-launch — haly se teprve otevírají, prezentace musí komunikovat vizi a budoucnost
- Padel = nejrychleji rostoucí raketový sport v Evropě

# Vibe značky
Tmavý dramatický prémium. Sebevědomý, vážný, prémiový tón. Žádné laciné fráze ("synergie", "win-win"). Konkrétní, věcný.

# Zadání pro tuto prezentaci
- **Firma:** ${d.firmaNazev}
- **Kontakt:** ${kontakt}
${d.firmaWeb ? `- **Web:** ${d.firmaWeb}` : ""}
- **Typ spolupráce:** ${typy}
- **Lokalita:** ${lok}
- **Velikost firmy:** ${vel}
- **Bez cen v prezentaci:** ${d.bezCen ? "ano" : "ne"}
${d.dodatecneInfo ? `\n**Dodatečný kontext od zadavatele:**\n${d.dodatecneInfo}` : ""}

# Pravidla pro obsah
- uvod: 2–3 věty, osobní oslovení (pokud máme kontakt) nebo na firmu jako celek
- hodnota: 3–5 bodů — proč Grand Padel jako partner, konkrétně
- konkretni_navrhy: 3–5 specifických návrhů podle zvolených typů spolupráce
- cenove_balicky: ${d.bezCen ? "PRÁZDNÉ POLE [] (uživatel zvolil bez cen)" : "2–4 balíčky odstupňované, realistické rozpětí v Kč"}
- call_to_action: 1–2 věty, návrh dalšího kroku
- dodatecne_info: 1–2 věty, např. otevírací termín v dané lokalitě

# Cenové rámce (pokud bez_cen=ne)
- Malá (do 50): 20–80 tis. Kč
- Střední (50–500): 50–250 tis. Kč
- Velká (500+): 150–800 tis. Kč
- Korporát (5000+): 500 tis. – 3 mil. Kč

# Výstup
Vrať **POUZE JSON**, žádný okolní text, žádný markdown code fence. Přesně tento formát:

{
  "uvod": "string",
  "hodnota": ["string", "string", "string"],
  "konkretni_navrhy": ["string", "string", "string"],
  "cenove_balicky": [
    {"nazev": "string", "popis": "string", "cena_min": 0, "cena_max": 0, "vhodne_pro": "string"}
  ],
  "call_to_action": "string",
  "dodatecne_info": "string"
}

Stylisticky: česky, bez emoji, profesionální.`;
}

function vyrizniJson(text: string): string {
  const t = text.trim();
  // Odstranění markdown code fence pokud AI ho přidalo
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) return fenced[1].trim();
  // Najít první { a poslední }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return t.slice(first, last + 1);
  }
  return t;
}
