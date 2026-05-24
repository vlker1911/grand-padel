// Design B — bordó-dominantní layout inspirovaný grandpadel.cz landing.
// Plné bordó pozadí na každém slidu, monogram GP vlevo, velká typografie,
// horizontální a vertikální bílé čáry jako brand prvek.
// Photo slides: fotka na pozadí + bordó overlay + text.

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
import type { Balicek } from "@/app/api/admin/prezentace/ulozit/route";
import type { PhotoSet, PrezentaceData } from "./PrezentacePdf";

// Poppins font už zaregistrován v PrezentacePdf.tsx, ale Font.register
// je idempotentní (stejná rodina + cesty = no-op).
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
const BG = "#801A28"; // bordó sjednocené s logem (Design A i B)
const PAGE_W = 960;
const PAGE_H = 540;
const STRIP_W = 110;

const s = StyleSheet.create({
  page: {
    width: PAGE_W,
    height: PAGE_H,
    fontFamily: FONT,
    fontSize: 14,
    color: brand.colors.white,
    backgroundColor: BG,
    flexDirection: "row",
    padding: 0,
  },
  // Levý vertikální pruh s monogramem
  leftStrip: {
    width: STRIP_W,
    borderRightWidth: 1,
    borderRightColor: brand.colors.white,
    padding: 28,
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  monogram: { width: 50, height: 50, objectFit: "contain" },
  // Hlavní obsahová oblast
  main: {
    flex: 1,
    padding: 48,
    paddingBottom: 50,
    flexDirection: "column",
    position: "relative",
  },
  bottomLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 22,
    height: 1,
    backgroundColor: brand.colors.white,
    opacity: 0.6,
  },
  pageNum: {
    position: "absolute",
    right: 48,
    bottom: 6,
    fontSize: 9,
    opacity: 0.5,
  },
  pageMeta: {
    position: "absolute",
    left: 48,
    bottom: 6,
    fontSize: 9,
    opacity: 0.5,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 3,
    color: brand.colors.cream,
    fontWeight: 600,
    marginBottom: 12,
  },
  bigTitle: {
    fontSize: 56,
    fontWeight: 900,
    lineHeight: 1.05,
    marginBottom: 18,
  },
  midTitle: {
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 400,
    lineHeight: 1.4,
    opacity: 0.9,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 1.55,
    opacity: 0.92,
  },
  bullet: { flexDirection: "row", marginBottom: 10, gap: 12 },
  bulletMark: {
    fontSize: 14,
    fontWeight: 700,
    color: brand.colors.cream,
    width: 22,
  },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 1.5 },
  // Cover
  coverTitle: {
    fontSize: 80,
    fontWeight: 900,
    lineHeight: 1,
    marginBottom: 12,
  },
  coverSub: { fontSize: 20, fontWeight: 400, opacity: 0.9, marginBottom: 16 },
  coverFoot: { fontSize: 11, opacity: 0.7, marginTop: 24 },
  // Stats
  statsRow: { flexDirection: "row", gap: 36, marginTop: 16 },
  stat: { flexDirection: "column" },
  statBig: { fontSize: 40, fontWeight: 900, color: brand.colors.cream, lineHeight: 1 },
  statLabel: { fontSize: 11, marginTop: 4, opacity: 0.85, maxWidth: 140 },
  // Centra list
  centrumRadek: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brand.colors.white,
    gap: 20,
  },
  centrumNazev: {
    fontSize: 22,
    fontWeight: 700,
    color: brand.colors.white,
    flex: 1,
  },
  centrumKdy: { fontSize: 13, color: brand.colors.cream, width: 200 },
  centrumPopis: { fontSize: 12, flex: 2, opacity: 0.85, lineHeight: 1.45 },
  // Balíčky
  balickyGrid: { flexDirection: "row", gap: 14, marginTop: 4 },
  balicek: {
    flex: 1,
    borderWidth: 1,
    borderColor: brand.colors.white,
    padding: 14,
    flexDirection: "column",
  },
  balicekNazev: { fontSize: 14, fontWeight: 700, color: brand.colors.cream, marginBottom: 6 },
  balicekPopis: { fontSize: 10, lineHeight: 1.4, marginBottom: 8, opacity: 0.85 },
  balicekCena: { fontSize: 13, fontWeight: 700, marginTop: "auto" },
  balicekVhodne: { fontSize: 9, opacity: 0.7, marginTop: 4 },
  // Photo slide (cover plný foto + bordó overlay)
  photoFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  photoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BG,
    opacity: 0.7,
  },
  // CTA
  ctaCard: {
    borderLeftWidth: 3,
    borderLeftColor: brand.colors.cream,
    paddingLeft: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  ctaText: { fontSize: 18, lineHeight: 1.4, fontWeight: 500 },
  kontaktRadek: { fontSize: 14, fontWeight: 500, marginBottom: 4 },
  // Děkujeme
  bigClose: { fontSize: 110, fontWeight: 900, lineHeight: 1, marginBottom: 14 },
  closeSub: { fontSize: 20, opacity: 0.9 },
});

export function PrezentacePdfB({
  data,
  monogramBase64,
  photos = {},
}: {
  data: PrezentaceData;
  monogramBase64?: string;
  photos?: PhotoSet;
}) {
  const obsah = data.generovany_obsah;
  const datum = new Date(data.created_at).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const titulCen = data.bez_cen ? "Individuální nabídka" : "Cenové balíčky";

  function shell(
    cislo: number,
    children: React.ReactNode,
    opts?: { hidePageMeta?: boolean }
  ) {
    return (
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <View style={s.leftStrip}>
          {monogramBase64 && <Image src={monogramBase64} style={s.monogram} />}
        </View>
        <View style={s.main}>
          {children}
          <View style={s.bottomLine} />
          {!opts?.hidePageMeta && (
            <Text style={s.pageMeta}>Grand Padel · Návrh pro {data.firma_nazev}</Text>
          )}
          <Text style={s.pageNum}>{cislo}</Text>
        </View>
      </Page>
    );
  }

  return (
    <Document title={`Návrh spolupráce — ${data.firma_nazev}`} author="Grand Padel">
      {/* 1. COVER */}
      {shell(
        1,
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Text style={s.eyebrow}>NÁVRH SPOLUPRÁCE</Text>
          <Text style={s.coverTitle}>{data.firma_nazev}</Text>
          <Text style={s.coverSub}>Padel na nejvyšší úrovni</Text>
          <Text style={s.coverFoot}>Grand Padel · {datum}</Text>
        </View>,
        { hidePageMeta: true }
      )}

      {/* 2. O NÁS */}
      {shell(
        2,
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Text style={s.eyebrow}>O NÁS</Text>
          <Text style={s.bigTitle}>Síť indoor padel center{"\n"}v České republice</Text>
          <Text style={s.body}>
            Stavíme síť moderních indoor padel center s vlajkovým CENTER kurtem v každé hale.
            Pre-launch — první hala se otevírá na podzim 2026. Padel je nejrychleji rostoucí
            raketový sport v Evropě.
          </Text>
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statBig}>3</Text>
              <Text style={s.statLabel}>centra v plánu (2026–2027)</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statBig}>CENTER</Text>
              <Text style={s.statLabel}>vlajkový kurt v každé hale</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statBig}>2026</Text>
              <Text style={s.statLabel}>otevření první haly (Olomouc)</Text>
            </View>
          </View>
        </View>
      )}

      {/* 3. NAŠE CENTRA */}
      {shell(
        3,
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={s.eyebrow}>LOKALITY</Text>
          <Text style={s.midTitle}>Naše centra</Text>
          <View style={{ marginTop: 12 }}>
            <CentrumRadek
              nazev="Olomouc"
              kdy="otevření říjen 2026"
              popis="První centrum, srdce sítě. Strategická poloha mezi Brnem a Ostravou."
            />
            <CentrumRadek
              nazev="Ostrava"
              kdy="otevření prosinec 2026"
              popis="Pokrytí severní Moravy a Slezska. Spádově hala pro celý region."
            />
            <CentrumRadek
              nazev="Praha Zličín"
              kdy="únor–březen 2027"
              popis="Vlajkové centrum v největším padel trhu ČR. Snadná dostupnost."
            />
          </View>
        </View>
      )}

      {/* 4. HODNOTA */}
      {shell(
        4,
        <View style={{ flex: 1, flexDirection: "column" }}>
          <Text style={s.eyebrow}>HODNOTA</Text>
          <Text style={s.midTitle}>Proč Grand Padel{"\n"}jako partner</Text>
          <View style={{ marginTop: 12 }}>
            {obsah.hodnota.map((h, i) => (
              <View key={i} style={s.bullet}>
                <Text style={s.bulletMark}>{"—"}</Text>
                <Text style={s.bulletText}>{h}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 5. NÁVRHY */}
      {shell(
        5,
        <View style={{ flex: 1, flexDirection: "column" }}>
          <Text style={s.eyebrow}>NÁVRHY</Text>
          <Text style={s.midTitle}>Konkrétní možnosti spolupráce</Text>
          <View style={{ marginTop: 12 }}>
            {obsah.konkretni_navrhy.map((n, i) => (
              <View key={i} style={s.bullet}>
                <Text style={s.bulletMark}>{`${i + 1}.`}</Text>
                <Text style={s.bulletText}>{n}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 6. CENOVÉ BALÍČKY */}
      {shell(
        6,
        <View style={{ flex: 1, flexDirection: "column" }}>
          <Text style={s.eyebrow}>NABÍDKA</Text>
          <Text style={s.midTitle}>{titulCen}</Text>
          {data.bez_cen || obsah.cenove_balicky.length === 0 ? (
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 18, lineHeight: 1.5, maxWidth: 600, opacity: 0.9 }}>
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
        </View>
      )}

      {/* 7. TITLE SPONSORSHIP — split layout: bordó text + čistá fotka centerVstup */}
      {shell(
        7,
        <View style={{ flex: 1, flexDirection: "row", gap: 28 }}>
          <View style={{ flex: 1.2, justifyContent: "flex-end" }}>
            <Text style={s.eyebrow}>VAŠE TITLE SPONSORSHIP EXPERIENCE</Text>
            <Text style={s.midTitle}>
              {data.firma_nazev}{"\n"}na CENTER kurtu
            </Text>
            <Text style={s.subTitle}>
              Vlajkový prémiový kurt v brandu vaší značky. Naming rights, viditelnost
              v každém zápase, dominantní pozice v hale.
            </Text>
          </View>
          <View style={{ flex: 1, justifyContent: "center" }}>
            {photos.centerVstup || photos.center ? (
              <Image
                src={(photos.centerVstup || photos.center)!}
                style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 4 }}
              />
            ) : (
              <View style={{ width: "100%", height: 320, backgroundColor: "#5F0C19", borderRadius: 4 }} />
            )}
          </View>
        </View>
      )}

      {/* 8. GALERIE — 3 čisté fotky vedle sebe */}
      {shell(
        8,
        <View style={{ flex: 1, flexDirection: "column" }}>
          <Text style={s.eyebrow}>ATMOSFÉRA</Text>
          <Text style={s.midTitle}>Hala, kde se chce být</Text>
          <View style={{ flex: 1, flexDirection: "row", gap: 10, marginTop: 16 }}>
            <FotoCista src={photos.akce} popis="Hra v plné akci" />
            <FotoCista src={photos.teambuilding} popis="Firemní teambuildingy" />
            <FotoCista src={photos.hero} popis="Prémiová hala" />
          </View>
        </View>
      )}

      {/* 9. CTA */}
      {shell(
        9,
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={s.eyebrow}>DALŠÍ KROK</Text>
          <Text style={s.bigTitle}>Pojďme se sejít</Text>
          <View style={s.ctaCard}>
            <Text style={s.ctaText}>{obsah.call_to_action}</Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 10, letterSpacing: 2, opacity: 0.7, marginBottom: 8 }}>KONTAKT</Text>
            <Text style={s.kontaktRadek}>Roman Vlk — Grand Padel</Text>
            <Text style={s.kontaktRadek}>info@grandpadel.cz</Text>
            <Text style={s.kontaktRadek}>grandpadel.cz</Text>
          </View>
          {obsah.dodatecne_info && (
            <Text style={{ fontSize: 10, opacity: 0.6, marginTop: 16 }}>
              {obsah.dodatecne_info}
            </Text>
          )}
        </View>
      )}

      {/* 10. DĚKUJEME */}
      {shell(
        10,
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={s.bigClose}>Děkujeme.</Text>
          <View style={{ height: 36 }} />
          <Text style={s.closeSub}>
            {data.firma_nazev} & Grand Padel — spolupráce, která dává smysl.
          </Text>
        </View>,
        { hidePageMeta: true }
      )}
    </Document>
  );
}

function FotoCista({ src, popis }: { src: string | undefined; popis: string }) {
  return (
    <View style={{ flex: 1, flexDirection: "column", gap: 6 }}>
      {src ? (
        <Image src={src} style={{ flex: 1, width: "100%", objectFit: "cover", borderRadius: 4 }} />
      ) : (
        <View style={{ flex: 1, width: "100%", backgroundColor: "#5F0C19", borderRadius: 4 }} />
      )}
      <Text style={{ fontSize: 10, color: brand.colors.cream, opacity: 0.85 }}>{popis}</Text>
    </View>
  );
}

function CentrumRadek({
  nazev,
  kdy,
  popis,
}: {
  nazev: string;
  kdy: string;
  popis: string;
}) {
  return (
    <View style={s.centrumRadek}>
      <Text style={s.centrumNazev}>{nazev}</Text>
      <Text style={s.centrumKdy}>{kdy}</Text>
      <Text style={s.centrumPopis}>{popis}</Text>
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
