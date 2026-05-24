import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { brand } from "@/lib/brand";
import type { GenerovanyObsah, Balicek } from "@/app/api/admin/prezentace/ulozit/route";

// Poppins TTF lokálně v public/fonts/poppins/.
const FONT_DIR = path.join(process.cwd(), "public", "fonts", "poppins");
Font.register({
  family: "Poppins",
  fonts: [
    { src: path.join(FONT_DIR, "Poppins-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "Poppins-Medium.ttf"), fontWeight: 500 },
    { src: path.join(FONT_DIR, "Poppins-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(FONT_DIR, "Poppins-Bold.ttf"), fontWeight: 700 },
    { src: path.join(FONT_DIR, "Poppins-Black.ttf"), fontWeight: 900 },
  ],
});

const FONT = "Poppins";

// Cover bordó SJEDNOCEN S LOGO PNG (#801A28) aby okraje loga nebyly viditelné.
// Brand Red akcenty zůstávají na #8C1325 (web reality).
const COVER_BG = "#801A28";

// 16:9 widescreen — 960 × 540pt
const PAGE_W = 960;
const PAGE_H = 540;

const s = StyleSheet.create({
  page: {
    width: PAGE_W,
    height: PAGE_H,
    fontFamily: FONT,
    fontSize: 14,
    color: brand.colors.black,
    padding: 50,
  },
  pageDark: {
    width: PAGE_W,
    height: PAGE_H,
    fontFamily: FONT,
    fontSize: 14,
    color: brand.colors.white,
    backgroundColor: COVER_BG,
    padding: 50,
  },
  pageCream: {
    width: PAGE_W,
    height: PAGE_H,
    fontFamily: FONT,
    fontSize: 14,
    color: brand.colors.black,
    backgroundColor: brand.colors.cream,
    padding: 50,
  },
  // Cover
  coverWrap: { flex: 1, flexDirection: "column", justifyContent: "space-between" },
  coverHead: { fontSize: 11, opacity: 0.7, letterSpacing: 2 },
  coverTitle: { fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 16 },
  coverSub: { fontSize: 18, fontWeight: 400, opacity: 0.85 },
  coverFoot: { fontSize: 10, opacity: 0.6 },
  // Head bloky (eyebrow + title + court line)
  slideEyebrow: { fontSize: 10, letterSpacing: 2, color: brand.colors.red, marginBottom: 8, fontWeight: 600 },
  slideTitle: { fontSize: 28, fontWeight: 700, lineHeight: 1.2 },
  // "Linka hřiště" = bílá/červená čára pod titulem jako brand prvek
  courtLine: {
    height: 2,
    width: 64,
    backgroundColor: brand.colors.red,
    marginTop: 14,
    marginBottom: 24,
  },
  courtLineWhite: {
    height: 2,
    width: 64,
    backgroundColor: brand.colors.white,
    marginTop: 14,
    marginBottom: 24,
    opacity: 0.7,
  },
  // Bullets
  bullet: { flexDirection: "row", marginBottom: 10, gap: 8 },
  bulletMark: { fontSize: 14, fontWeight: 700, color: brand.colors.red, width: 18 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 1.45 },
  // Centra karty
  centrum: { flex: 1, backgroundColor: brand.colors.white, borderRadius: 8, overflow: "hidden" },
  centrumFoto: { width: "100%", height: 140, objectFit: "cover" },
  centrumFotoPlaceholder: { width: "100%", height: 140, backgroundColor: "#E5E3DE" },
  centrumObsah: { padding: 16, flex: 1 },
  centrumNazev: { fontSize: 18, fontWeight: 700, color: brand.colors.red },
  centrumKdy: { fontSize: 11, color: brand.colors.muted, marginTop: 2 },
  centrumPopis: { fontSize: 12, lineHeight: 1.5, marginTop: 8 },
  // Balíček karta
  balickyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  balicek: {
    width: (PAGE_W - 100 - 24) / 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E3DE",
    padding: 12,
    backgroundColor: brand.colors.white,
  },
  balicekNazev: { fontSize: 14, fontWeight: 700, color: brand.colors.red, marginBottom: 4 },
  balicekPopis: { fontSize: 10, lineHeight: 1.4, marginBottom: 6 },
  balicekCena: { fontSize: 12, fontWeight: 600 },
  balicekVhodne: { fontSize: 9, color: brand.colors.muted, marginTop: 2 },
  // Page foot
  pageFoot: {
    position: "absolute",
    left: 50,
    right: 50,
    bottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    opacity: 0.5,
  },
  // CTA
  ctaBlok: { backgroundColor: brand.colors.white, borderRadius: 8, padding: 24, flexDirection: "column", gap: 12 },
  ctaText: { fontSize: 16, lineHeight: 1.4, fontWeight: 500 },
  kontaktRadek: { fontSize: 13, fontWeight: 500 },
  // Děkujeme
  closeBig: { fontSize: 80, fontWeight: 900, color: brand.colors.white, lineHeight: 1, marginBottom: 16 },
  closeSub: { fontSize: 18, opacity: 0.85, color: brand.colors.white },
  // Atmosféra collage
  collageGrid: { flex: 1, flexDirection: "row", gap: 12 },
  collageCol: { flex: 1, flexDirection: "column", gap: 12 },
  collageFoto: { flex: 1, width: "100%", objectFit: "cover", borderRadius: 4 },
  collageFotoPlaceholder: { flex: 1, width: "100%", backgroundColor: "#E5E3DE", borderRadius: 4 },
});

export type PhotoSet = {
  hero?: string;
  akce?: string;
  center?: string;
  centerVstup?: string;
  teambuilding?: string;
  detail?: string;
};

export type PrezentaceData = {
  firma_nazev: string;
  firma_kontakt_jmeno: string | null;
  firma_kontakt_pozice: string | null;
  firma_kontakt_email: string | null;
  firma_kontakt_telefon: string | null;
  typy_spoluprace: string[];
  lokalita: string;
  bez_cen: boolean;
  generovany_obsah: GenerovanyObsah;
  created_at: string;
};

export function PrezentacePdf({
  data,
  logoBase64,
  photos = {},
}: {
  data: PrezentaceData;
  logoBase64?: string;
  photos?: PhotoSet;
}) {
  const obsah = data.generovany_obsah;
  const datum = new Date(data.created_at).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Bug fix: extrahovat ternární výraz z JSX, jinak react-pdf občas
  // pohltí první znak titulu (vidět u "Cenové balíčky" → "enové balíčky").
  const titulCen = data.bez_cen ? "Individuální nabídka" : "Cenové balíčky";

  return (
    <Document title={`Návrh spolupráce — ${data.firma_nazev}`} author="Grand Padel">
      {/* 1. COVER */}
      <Page size={[PAGE_W, PAGE_H]} style={s.pageDark}>
        <View style={s.coverWrap}>
          <View>
            {logoBase64 && (
              <Image src={logoBase64} style={{ width: 120, height: 48, objectFit: "contain" }} />
            )}
          </View>
          <View>
            <Text style={s.coverHead}>NÁVRH SPOLUPRÁCE</Text>
            <View style={{ height: 12 }} />
            <Text style={s.coverTitle}>{data.firma_nazev}</Text>
            <Text style={s.coverSub}>Padel na nejvyšší úrovni</Text>
            <View style={s.courtLineWhite} />
          </View>
          <Text style={s.coverFoot}>Grand Padel · {datum}</Text>
        </View>
      </Page>

      {/* 2. O GRAND PADELU — text + hero foto */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.slideEyebrow}>O NÁS</Text>
        <Text style={s.slideTitle}>Síť indoor padel center{"\n"}v České republice</Text>
        <View style={s.courtLine} />
        <View style={{ flex: 1, flexDirection: "row", gap: 28 }}>
          <View style={{ flex: 1, justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
                Stavíme síť moderních indoor padel center s vlajkovým CENTER kurtem v každé hale.
                Pre-launch — první hala se otevírá na podzim 2026.
              </Text>
              <Text style={{ fontSize: 13, lineHeight: 1.5 }}>
                Padel je nejrychleji rostoucí raketový sport v Evropě. V České republice tvoříme
                od základu prémiovou ligu, klubové prostředí a komunitu hráčů a partnerů.
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 16, marginTop: 16 }}>
              <Statistika cislo="3" popis="centra v plánu" />
              <Statistika cislo="CENTER" popis="vlajkový kurt" />
              <Statistika cislo="2026" popis="otevření Olomouce" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <FotoNeboPlaceholder src={photos.hero} style={{ flex: 1, width: "100%", borderRadius: 6, objectFit: "cover" }} />
          </View>
        </View>
        <PageFoot firma={data.firma_nazev} cislo={2} />
      </Page>

      {/* 3. NAŠE CENTRA — karty s foto */}
      <Page size={[PAGE_W, PAGE_H]} style={s.pageCream}>
        <Text style={s.slideEyebrow}>LOKALITY</Text>
        <Text style={s.slideTitle}>Naše centra</Text>
        <View style={s.courtLine} />
        <View style={{ flex: 1, flexDirection: "row", gap: 18 }}>
          <CentrumKarta
            foto={photos.hero}
            nazev="Olomouc"
            kdy="otevření říjen 2026"
            popis="První centrum, srdce sítě. Strategická poloha mezi Brnem a Ostravou."
          />
          <CentrumKarta
            foto={photos.akce}
            nazev="Ostrava"
            kdy="otevření prosinec 2026"
            popis="Pokrytí severní Moravy a Slezska. Spádově hala pro celý region."
          />
          <CentrumKarta
            foto={photos.center}
            nazev="Praha Zličín"
            kdy="únor–březen 2027"
            popis="Vlajkové centrum v největším padel trhu ČR. Snadná dostupnost."
          />
        </View>
        <PageFoot firma={data.firma_nazev} cislo={3} />
      </Page>

      {/* 4. HODNOTA PRO PARTNERA */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.slideEyebrow}>HODNOTA</Text>
        <Text style={s.slideTitle}>Proč Grand Padel{"\n"}jako partner</Text>
        <View style={s.courtLine} />
        <View style={{ flex: 1, flexDirection: "column" }}>
          {obsah.hodnota.map((h, i) => (
            <View key={i} style={s.bullet}>
              <Text style={s.bulletMark}>▸</Text>
              <Text style={s.bulletText}>{h}</Text>
            </View>
          ))}
        </View>
        <PageFoot firma={data.firma_nazev} cislo={4} />
      </Page>

      {/* 5. KONKRÉTNÍ NÁVRHY */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.slideEyebrow}>NÁVRHY</Text>
        <Text style={s.slideTitle}>Konkrétní možnosti spolupráce</Text>
        <View style={s.courtLine} />
        <View style={{ flex: 1, flexDirection: "column" }}>
          {obsah.konkretni_navrhy.map((n, i) => (
            <View key={i} style={s.bullet}>
              <Text style={s.bulletMark}>{`${i + 1}.`}</Text>
              <Text style={s.bulletText}>{n}</Text>
            </View>
          ))}
        </View>
        <PageFoot firma={data.firma_nazev} cislo={5} />
      </Page>

      {/* 6. CENOVÉ BALÍČKY */}
      <Page size={[PAGE_W, PAGE_H]} style={s.pageCream}>
        <Text style={s.slideEyebrow}>NABÍDKA</Text>
        <Text style={s.slideTitle}>{titulCen}</Text>
        <View style={s.courtLine} />
        {data.bez_cen || obsah.cenove_balicky.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text style={{ fontSize: 18, color: brand.colors.muted, lineHeight: 1.5, maxWidth: 600 }}>
              Konkrétní nabídku zpracujeme po úvodním setkání — přizpůsobíme ji vašim cílům,
              rozpočtu a očekávané viditelnosti partnerství.
            </Text>
          </View>
        ) : (
          <View style={s.balickyGrid}>
            {obsah.cenove_balicky.map((b, i) => (
              <BalicekKarta key={i} balicek={b} />
            ))}
          </View>
        )}
        <PageFoot firma={data.firma_nazev} cislo={6} />
      </Page>

      {/* 7. TITLE SPONSORSHIP — CENTER kurt z dvou úhlů + atmosféra */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.slideEyebrow}>VAŠE TITLE SPONSORSHIP EXPERIENCE</Text>
        <Text style={s.slideTitle}>{data.firma_nazev}{"\n"}na CENTER kurtu</Text>
        <View style={s.courtLine} />
        <View style={s.collageGrid}>
          <View style={s.collageCol}>
            <FotoNeboPlaceholder src={photos.center} style={{ flex: 2, width: "100%", objectFit: "cover", borderRadius: 4 }} />
            <FotoNeboPlaceholder src={photos.akce} style={{ flex: 1, width: "100%", objectFit: "cover", borderRadius: 4 }} />
          </View>
          <View style={s.collageCol}>
            <FotoNeboPlaceholder src={photos.centerVstup} style={{ flex: 2, width: "100%", objectFit: "cover", borderRadius: 4 }} />
            <FotoNeboPlaceholder src={photos.teambuilding} style={{ flex: 1, width: "100%", objectFit: "cover", borderRadius: 4 }} />
          </View>
        </View>
        <PageFoot firma={data.firma_nazev} cislo={7} />
      </Page>

      {/* 8. VÝZVA K AKCI */}
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <Text style={s.slideEyebrow}>DALŠÍ KROK</Text>
        <Text style={s.slideTitle}>Pojďme se sejít</Text>
        <View style={s.courtLine} />
        <View style={{ flex: 1, flexDirection: "column", gap: 20 }}>
          <View style={s.ctaBlok}>
            <Text style={s.ctaText}>{obsah.call_to_action}</Text>
          </View>
          <View style={{ flexDirection: "column", gap: 6 }}>
            <Text style={{ fontSize: 11, color: brand.colors.muted, letterSpacing: 2, marginBottom: 4 }}>KONTAKT</Text>
            <Text style={s.kontaktRadek}>Roman Vlk — Grand Padel</Text>
            <Text style={s.kontaktRadek}>info@grandpadel.cz</Text>
            <Text style={s.kontaktRadek}>grandpadel.cz</Text>
          </View>
          {obsah.dodatecne_info && (
            <Text style={{ fontSize: 10, color: brand.colors.muted, marginTop: 8 }}>
              {obsah.dodatecne_info}
            </Text>
          )}
        </View>
        <PageFoot firma={data.firma_nazev} cislo={8} />
      </Page>

      {/* 9. DĚKUJEME */}
      <Page size={[PAGE_W, PAGE_H]} style={s.pageDark}>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={s.closeBig}>Děkujeme.</Text>
          <Text style={s.closeSub}>{data.firma_nazev}, věříme, že má spolupráce smysl.</Text>
          <View style={s.courtLineWhite} />
        </View>
        <Text style={{ fontSize: 10, color: brand.colors.white, opacity: 0.5 }}>grandpadel.cz</Text>
      </Page>
    </Document>
  );
}

// ──────────────────────────────────────────────────────────
function Statistika({ cislo, popis }: { cislo: string; popis: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: 900, color: brand.colors.red }}>{cislo}</Text>
      <Text style={{ fontSize: 9, color: brand.colors.muted, marginTop: 2 }}>{popis}</Text>
    </View>
  );
}

function CentrumKarta({
  foto,
  nazev,
  kdy,
  popis,
}: {
  foto: string | undefined;
  nazev: string;
  kdy: string;
  popis: string;
}) {
  return (
    <View style={s.centrum}>
      {foto ? (
        <Image src={foto} style={s.centrumFoto} />
      ) : (
        <View style={s.centrumFotoPlaceholder} />
      )}
      <View style={s.centrumObsah}>
        <Text style={s.centrumNazev}>{nazev}</Text>
        <Text style={s.centrumKdy}>{kdy}</Text>
        <Text style={s.centrumPopis}>{popis}</Text>
      </View>
    </View>
  );
}

function BalicekKarta({ balicek }: { balicek: Balicek }) {
  return (
    <View style={s.balicek}>
      <Text style={s.balicekNazev}>{balicek.nazev}</Text>
      <Text style={s.balicekPopis}>{balicek.popis}</Text>
      <Text style={s.balicekCena}>
        {balicek.cena_min.toLocaleString("cs-CZ")} – {balicek.cena_max.toLocaleString("cs-CZ")} Kč
      </Text>
      <Text style={s.balicekVhodne}>Vhodné pro: {balicek.vhodne_pro}</Text>
    </View>
  );
}

function PageFoot({ firma, cislo }: { firma: string; cislo: number }) {
  return (
    <View style={s.pageFoot}>
      <Text>Grand Padel · Návrh pro {firma}</Text>
      <Text>{cislo}</Text>
    </View>
  );
}

type FotoStyle = Parameters<typeof Image>[0]["style"];
function FotoNeboPlaceholder({ src, style }: { src: string | undefined; style: FotoStyle }) {
  if (src) return <Image src={src} style={style} />;
  return <View style={[style, { backgroundColor: "#E5E3DE" }] as FotoStyle} />;
}
