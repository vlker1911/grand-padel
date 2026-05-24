// Prompty pro Gemini (a jiné AI generátory obrázků), které Roman vkládá
// při tvorbě prezentace. Každý slot má svůj prompt, fotku partner stahuje
// a uploaduje do UI.

export type PhotoSlot = "hero" | "akce" | "center" | "centerVstup" | "teambuilding" | "detail";

export const PHOTO_SLOTS: ReadonlyArray<{
  slot: PhotoSlot;
  label: string;
  filename: string;
  perPrezentace: boolean;
  prompt: string;
}> = [
  {
    slot: "hero",
    label: "Hero — prázdný standardní kurt",
    filename: "hero-kurt.jpg",
    perPrezentace: false,
    prompt: `Vytvoř realistickou architektonickou fotografii indoor padel kurtu v moderní hale Grand Padel. Hala má industriální ocelovou příhradovou konstrukci stropu s LED panelovým osvětlením, vysoký strop, čistý moderní vzhled. Povrch kurtu je bordó (#8C1325) s bílými čárami. Okolo kurtu je šedý sportovní koberec. Mantinely a sloupky jsou černé, skleněné stěny, nahoře černá pletivová mřížka. V pozadí je vidět část lounge prostoru s moderním L-sezením z tmavé kůže a barovou zónou. Atmosféra prémiového klubu, tmavý dramatický vibe, žádní lidé, cinematic lighting. 16:9 widescreen.`,
  },
  {
    slot: "akce",
    label: "Akce — hráči na kurtu",
    filename: "akce-hraci.jpg",
    perPrezentace: false,
    prompt: `Vytvoř realistickou sportovní fotografii padel zápasu: dva hráči stejného týmu (muž a žena, věk 30-40) na bordó padel kurtu, oba ČELEM K SÍTI (nikdy zády). Žena ve středním poli připravená v základním padel postoji, raketa před tělem. Muž u sítě právě dynamicky útočí — smash nad sítí, raketa nad hlavou, míček odlétá PŘES síť na opačnou stranu kurtu. Profesionální sportovní oblečení v tmavých barvách. KAMERA JE UMÍSTĚNA Z DRUHÉ STRANY SÍTĚ (pohled ze soupeřovy půlky) nebo z BOČNÍHO úhlu, tak, aby byli hráči zachyceni z předního pohledu — vidíme jim do tváří soustředěné na hru. Hala má industriální ocelovou příhradovou konstrukci stropu s LED osvětlením, černé sloupky a skleněné mantinely. Povrch kurtu bordó (#8C1325), okolí šedý sportovní koberec. Mírně podexponované pozadí, ostrý fokus na hráče. Tmavý dramatický prémium vibe. 16:9 widescreen.`,
  },
  {
    slot: "center",
    label: "CENTER kurt — širší architektonický záběr s logem (PER PREZENTACE!)",
    filename: "center-kurt.jpg",
    perPrezentace: true,
    prompt: `Vytvoř realistickou architektonickou fotografii vlajkového CENTER padel kurtu v hale Grand Padel. POZOR: CENTER kurt má INVERZNÍ barevné schéma — povrch kurtu je ŠEDÝ, BÍLÉ čáry. Mantinely a sloupky černé, skleněné stěny celé, černá pletivová mřížka nahoře.

LOGO PARTNERA "{PARTNER}" (např. ALZA nebo ROHLÍK) se objevuje na DVOU místech:

1) VELKÝ BÍLÝ NÁPIS "{PARTNER}" vepsaný do BORDÓ KOBERCE V PŘEDNÍ ČÁSTI PŘED KURTEM (mimo herní pole, na podlaze před vstupem do kurtu) — dominantní, čitelný shora, hlavní výrazný prvek fotografie.

2) NÁPIS "{PARTNER}" na ZADNÍ SKLENĚNÉ STĚNĚ KURTU — provedený jako PÍSKOVANÉ / ETCHED SKLO (matný, polotransparentní efekt), bílá/světlá barva. Funguje jako branding skla, nerušený herní výhled. Viditelný z obou stran (z kurtu i z lounge zóny).

ŽÁDNÉ LOGO PŘÍMO NA ŠEDÉM POVRCHU KURTU.

Okolo celého kurtu je BORDÓ (#8C1325) sportovní koberec pokrývající CELOU PLOCHU od skleněného mantinelu kurtu až k černým stěnám haly.

CENTER kurt je nasvícen DRAMATICKÝM SPOTLIGHTEM — silnější LED panely shora přímo nad kurtem (kruhové LED rámy "hoops"), jasně osvětlený herní prostor.

Po straně kurtu (na bordó koberci) je MODERNÍ LOUNGE ZÓNA s L-SEZENÍM v SVĚTLE ŠEDÉ ČALOUNĚNÉ ÚPRAVĚ (ladí s šedým kurtem) a designovým dřevěným stolkem. Nad lounge zónou závěsné designové LED lampy — lounge je jasně nasvícený.

V pozadí barová zóna ("GRAND PADEL BAR" nápis). Hala má industriální ocelovou příhradovou konstrukci stropu s LED panely. Bez lidí, prémiový sport venue feel, tmavá dramatická atmosféra ALE CENTER kurt + lounge jsou jasně osvětlené. 16:9 widescreen.`,
  },
  {
    slot: "centerVstup",
    label: "CENTER kurt — vstup s logem a barvami partnera (PER PREZENTACE!)",
    filename: "center-kurt-vstup.jpg",
    perPrezentace: true,
    prompt: `Vytvoř realistickou architektonickou fotografii VSTUPU NA CENTER PADEL KURT v hale Grand Padel — TITLE SPONSORSHIP experience pro partnera "{PARTNER}".

REÁLNÝ PADEL KURT — DŮLEŽITÉ:
- CENTER kurt má standardní rozměry 10×20 m, obklopený skleněnými mantinely vysokými ~3 m
- VSTUPNÍ DVEŘE jsou na DELŠÍ (BOČNÍ) STĚNĚ kurtu UPROSTŘED (mid-court), NIKDY v zadní/přední krátké stěně
- Dveře jsou součástí skleněné stěny — otevíratelný skleněný panel v hliníkovém rámu
- Velikost dveří: cca 2 m vysoké × 1 m široké — BĚŽNÁ VELIKOST DVEŘÍ
- Rám dveří je úzký (jako u skleněné vchodové dveře, NE masivní pylon)
- NAD SKLENĚNÝMI STĚNAMI je TENKÝ PÁS PLETIVOVÉ MŘÍŽKY (cca 30-40 cm vysoký) kolem celého obvodu kurtu
- Síť uprostřed kurtu kolmo na boční stěny

KAMERA: Pohled z bordó koberce na BOČNÍ STĚNU kurtu, mírně z úhlu, tak aby byl OTEVŘENÝ VSTUP do kurtu výrazně viditelný v rámu fotografie. Skrz otevřené dveře vidět šedý povrch kurtu se sítí.

DŮLEŽITÉ: ŽÁDNÍ HRÁČI, prázdný kurt. Statický architektonický záběr s referencí na reálný moderní indoor padel kurt (Vamos Padel, Padel Heaven, City Padel jako příklady reálných instalací).

BRANDOVÁNÍ — PRIMÁRNÍ BARVA {PARTNER_COLOR} + SEKUNDÁRNÍ BARVA {PARTNER_COLOR_2}:
1) RÁM VSTUPNÍCH DVEŘÍ na boční stěně — úzký, ale jasně v barvě {PARTNER_COLOR} (primární). NE masivní pylon, jen barevný rám okolo skleněných dveří.
2) Horní PLETIVOVÁ MŘÍŽKA (TENKÝ pás 30-40 cm nad skleněnými mantinely) v barvě {PARTNER_COLOR} (primární)
3) PÁSKA NAHOŘE NA SÍTI v barvě {PARTNER_COLOR_2} (sekundární) — výraznější, viditelná skrz otevřený vchod. Pokud partner nemá sekundární barvu, použij primární {PARTNER_COLOR}.

KURT:
- Povrch ŠEDÝ s BÍLÝMI čárami
- Síť uprostřed s páskou v barvě partnera
- Skleněné stěny po celém obvodu, hliníkové sloupky v rozích a ve spojích — ČERNÉ (kromě rámu dveří)
- Bordó (#8C1325) koberec OKOLO celého kurtu až k černým stěnám haly

LOGO PARTNERA "{PARTNER}" — TŘI UMÍSTĚNÍ:
1) VELKÝ BÍLÝ NÁPIS "{PARTNER}" na BORDÓ KOBERCI v popředí před vstupními dveřmi (mimo herní pole, dominantní, čitelný shora). Písmo SANS-SERIF moderní bold (NE kurzíva, NE script).
2) NÁPIS "{PARTNER}" U VSTUPNÍCH DVEŘÍ — viditelný a čitelný. Buď bílý nápis na skle dveří (pískované/etched glass), nebo vertikální banner v barvě {PARTNER_COLOR} vedle dveří. Musí být čitelný z perspektivy fotografie.
3) NÁPIS "{PARTNER}" NA PÁSCE NA SÍTI — bílý text "{PARTNER}" na barevné pásce nahoře na síti (jako branding tape u tenisových turnajů). Čitelný skrz otevřený vchod.

LOUNGE ZÓNA A POZADÍ:
- Po straně kurtu (na bordó koberci) MODERNÍ LOUNGE ZÓNA s L-SEZENÍM ve světle ŠEDÉ čalouněné úpravě (NE kožené, NE tmavé)
- Nad lounge JASNÉ OSVĚTLENÍ — designové závěsné LED lampy. Lounge je dobře vidět.
- V POZADÍ viditelný nápis "GRAND PADEL BAR"
- Hala má industriální ocelovou příhradovou konstrukci stropu s LED panely, vysoký strop

OSVĚTLENÍ:
- LED panely shora, dramatic spotlight na kurt + lounge
- Tmavé okolí haly, ALE CENTER kurt + lounge + bar JSOU JASNĚ OSVĚTLENÉ
- Kontrastní lighting

Bez lidí, prémiový venue feel, REALISTIC architectural photography odpovídající skutečným moderním padel halám. 16:9 widescreen.`,
  },
  {
    slot: "teambuilding",
    label: "Teambuilding — firemní večer",
    filename: "teambuilding.jpg",
    perPrezentace: false,
    prompt: `Vytvoř realistickou fotografii firemního teambuildingu v hale Grand Padel. Cca 20 dospělých z české firmy (mix žen a mužů, věk 28-50, business casual + sportovní outfit) v lounge zóně haly. Lidé jsou ve SKUPINKÁCH 3-5 osob — povídají si, smějí se, drží sklenice s nealkem/vínem, autentické konverzace, ne pózování do kamery.

V POPŘEDÍ je vidět část ŠVÉDSKÉHO STOLU — dlouhý dřevěný buffet stůl s občerstvením: mísy s ovocem, klobásami, sýrovým platou, finger food, nealko nápoje v karafách, sklenice. Profesionální catering setup.

Lounge zóna má MODERNÍ L-SEZENÍ ve světle šedé čalouněné úpravě a designové stolky, někteří hosté tam sedí a baví se. V pozadí je VIDĚT SKRZ SKLENĚNÝ MANTINEL probíhající padel zápas — 4 hráči v plné akci na bordó kurtu, atmosférické rozmazání pohybem.

Hala má industriální ocelovou příhradovou konstrukci stropu s LED osvětlením, černé sloupky a skleněné mantinely. Bordó povrch kurtu, šedý koberec okolo. V pozadí barová zóna ("GRAND PADEL BAR").

Osvětlení: TEPLÉ ATMOSFÉRICKÉ — vyšší jas v lounge zóně, kurt v pozadí výrazněji nasvícený LED panely. Živé, sociální, prémiové. Žurnalistická fotografie zachycující autentický moment firemního večera. 16:9 widescreen.`,
  },
  {
    slot: "detail",
    label: "Detail — raketa a míček",
    filename: "detail-raketa.jpg",
    perPrezentace: false,
    prompt: `Vytvoř realistickou makro produktovou fotografii: detail moderní padel rakety (černý karbon s bordó akcenty) ležící na bordó (#8C1325) povrchu kurtu vedle žlutého padel míčku. Profesionální makro objektiv s mělkou hloubkou ostrosti. Boční dramatic light, kontrastní stíny. V neostrém pozadí náznak černých mantinelových sloupků a šedého koberce. Minimalist composition, prémiový sport equipment vibe. 16:9 widescreen.`,
  },
];
