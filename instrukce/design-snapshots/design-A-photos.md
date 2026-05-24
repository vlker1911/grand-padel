# Design A — Foto prompty (snapshot)

**Datum uložení:** 2026-05-24
**Verze projektu:** v0.19.4
**Git tag:** `design-A-photos` (pokud existuje)

> Tento snapshot zachycuje **kompletní sadu promptů a popisu vizuálního stylu** pro AI generaci fotek v aplikaci pro prezentace partnerům.
>
> Pokud někdy v budoucnu řekneš Claude "vrať Design A", obnoví se prompty z tohoto souboru zpět do `src/lib/photo-prompts.ts`.

## Charakteristika Designu A

- **Vibe:** Tmavý dramatický prémium (vibe A z brand DNA)
- **Brand Red:** `#8C1325` (kurty, koberec okolo CENTER)
- **Standardní kurty:** bordó povrch + bílé čáry + šedý koberec okolo + černé sloupky/mřížka
- **CENTER kurt (inverzní):** šedý povrch + bílé čáry + BORDÓ koberec okolo + černé sloupky/mřížka (kromě centerVstup, kde jsou prvky v partner-color)
- **Hala:** industriální ocelová příhradová konstrukce stropu, LED panelové osvětlení, vysoký strop, černé stěny, betonová podlaha
- **Lounge zóna:** moderní L-sezení ve světle šedé čalouněné úpravě, designové dřevěné stolky, závěsné LED lampy
- **Barová zóna:** s nápisem "GRAND PADEL BAR"
- **Logo partnera (CENTER kurt):** bílý sans-serif na bordó koberci v popředí + pískované/etched sklo na zadní stěně
- **Title sponsorship (centerVstup):** partner-color vstupní sloupky + tenký pás horní mřížky + páska na síti
- **Bez lidí** v architektonických záběrech (kromě akce + teambuilding)

## Sloty

| Slot | Filename | Per-prez | Use case |
|---|---|---|---|
| `hero` | hero-kurt.jpg | ne | Prázdný standardní bordó kurt |
| `akce` | akce-hraci.jpg | ne | Hráči v akci, čelem k síti |
| `center` | center-kurt.jpg | ano | CENTER widescreen s logem partnera |
| `centerVstup` | center-kurt-vstup.jpg | ano | CENTER vstup s partner-color brandingem |
| `teambuilding` | teambuilding.jpg | ne | 20 lidí, buffet, padel v pozadí |
| `detail` | detail-raketa.jpg | ne | Makro raketa + míček |

## Prompty (verze 2026-05-24)

### 1. hero

```
Vytvoř realistickou architektonickou fotografii indoor padel kurtu v moderní hale Grand Padel. Hala má industriální ocelovou příhradovou konstrukci stropu s LED panelovým osvětlením, vysoký strop, čistý moderní vzhled. Povrch kurtu je bordó (#8C1325) s bílými čárami. Okolo kurtu je šedý sportovní koberec. Mantinely a sloupky jsou černé, skleněné stěny, nahoře černá pletivová mřížka. V pozadí je vidět část lounge prostoru s moderním L-sezením z tmavé kůže a barovou zónou. Atmosféra prémiového klubu, tmavý dramatický vibe, žádní lidé, cinematic lighting. 16:9 widescreen.
```

### 2. akce

```
Vytvoř realistickou sportovní fotografii padel zápasu: dva hráči stejného týmu (muž a žena, věk 30-40) na bordó padel kurtu, oba ČELEM K SÍTI (nikdy zády). Žena ve středním poli připravená v základním padel postoji, raketa před tělem. Muž u sítě právě dynamicky útočí — smash nad sítí, raketa nad hlavou, míček odlétá PŘES síť na opačnou stranu kurtu. Profesionální sportovní oblečení v tmavých barvách. KAMERA JE UMÍSTĚNA Z DRUHÉ STRANY SÍTĚ (pohled ze soupeřovy půlky) nebo z BOČNÍHO úhlu, tak, aby byli hráči zachyceni z předního pohledu — vidíme jim do tváří soustředěné na hru. Hala má industriální ocelovou příhradovou konstrukci stropu s LED osvětlením, černé sloupky a skleněné mantinely. Povrch kurtu bordó (#8C1325), okolí šedý sportovní koberec. Mírně podexponované pozadí, ostrý fokus na hráče. Tmavý dramatický prémium vibe. 16:9 widescreen.
```

### 3. center

```
Vytvoř realistickou architektonickou fotografii vlajkového CENTER padel kurtu v hale Grand Padel. POZOR: CENTER kurt má INVERZNÍ barevné schéma — povrch kurtu je ŠEDÝ, BÍLÉ čáry. Mantinely a sloupky černé, skleněné stěny celé, černá pletivová mřížka nahoře.

LOGO PARTNERA "{PARTNER}" (např. ALZA nebo ROHLÍK) se objevuje na DVOU místech:

1) VELKÝ BÍLÝ NÁPIS "{PARTNER}" vepsaný do BORDÓ KOBERCE V PŘEDNÍ ČÁSTI PŘED KURTEM (mimo herní pole, na podlaze před vstupem do kurtu) — dominantní, čitelný shora, hlavní výrazný prvek fotografie.

2) NÁPIS "{PARTNER}" na ZADNÍ SKLENĚNÉ STĚNĚ KURTU — provedený jako PÍSKOVANÉ / ETCHED SKLO (matný, polotransparentní efekt), bílá/světlá barva. Funguje jako branding skla, nerušený herní výhled. Viditelný z obou stran (z kurtu i z lounge zóny).

ŽÁDNÉ LOGO PŘÍMO NA ŠEDÉM POVRCHU KURTU.

Okolo celého kurtu je BORDÓ (#8C1325) sportovní koberec pokrývající CELOU PLOCHU od skleněného mantinelu kurtu až k černým stěnám haly.

CENTER kurt je nasvícen DRAMATICKÝM SPOTLIGHTEM — silnější LED panely shora přímo nad kurtem (kruhové LED rámy "hoops"), jasně osvětlený herní prostor.

Po straně kurtu (na bordó koberci) je MODERNÍ LOUNGE ZÓNA s L-SEZENÍM v SVĚTLE ŠEDÉ ČALOUNĚNÉ ÚPRAVĚ (ladí s šedým kurtem) a designovým dřevěným stolkem. Nad lounge zónou závěsné designové LED lampy — lounge je jasně nasvícený.

V pozadí barová zóna ("GRAND PADEL BAR" nápis). Hala má industriální ocelovou příhradovou konstrukci stropu s LED panely. Bez lidí, prémiový sport venue feel, tmavá dramatická atmosféra ALE CENTER kurt + lounge jsou jasně osvětlené. 16:9 widescreen.
```

### 4. centerVstup

```
Vytvoř realistickou architektonickou fotografii VSTUPU NA CENTER PADEL KURT v hale Grand Padel — TITLE SPONSORSHIP experience pro partnera "{PARTNER}".

KAMERA: Mírně z boku, ale tak, aby BYLA VIDĚT OTEVŘENÁ VSTUPNÍ BRÁNA do kurtu a skrz ni šedý povrch kurtu se sítí.

DŮLEŽITÉ: ŽÁDNÍ HRÁČI, prázdný kurt. Žádné rakety, žádné míčky v letu. Statický architektonický záběr.

BRANDOVÁNÍ V BARVĚ {PARTNER_COLOR}:
1) VSTUPNÍ SLOUPKY a rám vstupních dveří jsou výrazně v barvě {PARTNER_COLOR} — DOMINANTNÍ prvek záběru
2) Horní PLETIVOVÁ MŘÍŽKA: pouze TENKÝ PÁS cca 30–40 cm vysoký bezprostředně nad horní hranou skleněných mantinelů. NESMÍ se rozšiřovat nahoru jako klec nebo box — jen úzký doplňkový pás kolem celého obvodu kurtu.
3) PÁSKA NAHOŘE NA SÍTI uprostřed kurtu v barvě {PARTNER_COLOR} — výraznější, viditelná skrz otevřený vchod

KURT:
- Povrch ŠEDÝ s BÍLÝMI čárami
- Síť uprostřed s páskou v barvě partnera
- Skleněné stěny, ostatní konstrukce ČERNÁ (kromě prvků v partner barvě)

LOGO PARTNERA "{PARTNER}":
- VELKÝ BÍLÝ NÁPIS "{PARTNER}" na BORDÓ KOBERCI v popředí před vstupem (mimo herní pole, dominantní, čitelný). Písmo SANS-SERIF moderní (NE kurzíva / NE script).

LOUNGE ZÓNA A POZADÍ:
- Po straně kurtu na bordó koberci LOUNGE ZÓNA s L-SEZENÍM ve světle ŠEDÉ čalouněné úpravě (NE kožené, NE tmavé)
- NAD LOUNGE JE JASNÉ OSVĚTLENÍ — designové závěsné LED lampy nebo bodovky. Lounge musí být DOBŘE VIDĚT, ne v šeru.
- V POZADÍ JE VIDITELNÝ NÁPIS "GRAND PADEL BAR" — nasvícený, malý ale čitelný, jako součást barové zóny haly.

OSVĚTLENÍ:
- LED panely shora, dramatic spotlight na kurt + lounge
- Tmavé okolí HALY, ale CENTER kurt + lounge zóna + bar JSOU JASNĚ OSVĚTLENÉ
- Kontrastní lighting

Bez lidí, prémiový venue feel, realistic architectural photography. 16:9 widescreen.
```

### 5. teambuilding

```
Vytvoř realistickou fotografii firemního teambuildingu v hale Grand Padel. Cca 20 dospělých z české firmy (mix žen a mužů, věk 28-50, business casual + sportovní outfit) v lounge zóně haly. Lidé jsou ve SKUPINKÁCH 3-5 osob — povídají si, smějí se, drží sklenice s nealkem/vínem, autentické konverzace, ne pózování do kamery.

V POPŘEDÍ je vidět část ŠVÉDSKÉHO STOLU — dlouhý dřevěný buffet stůl s občerstvením: mísy s ovocem, klobásami, sýrovým platou, finger food, nealko nápoje v karafách, sklenice. Profesionální catering setup.

Lounge zóna má MODERNÍ L-SEZENÍ ve světle šedé čalouněné úpravě a designové stolky, někteří hosté tam sedí a baví se. V pozadí je VIDĚT SKRZ SKLENĚNÝ MANTINEL probíhající padel zápas — 4 hráči v plné akci na bordó kurtu, atmosférické rozmazání pohybem.

Hala má industriální ocelovou příhradovou konstrukci stropu s LED osvětlením, černé sloupky a skleněné mantinely. Bordó povrch kurtu, šedý koberec okolo. V pozadí barová zóna ("GRAND PADEL BAR").

Osvětlení: TEPLÉ ATMOSFÉRICKÉ — vyšší jas v lounge zóně, kurt v pozadí výrazněji nasvícený LED panely. Živé, sociální, prémiové. Žurnalistická fotografie zachycující autentický moment firemního večera. 16:9 widescreen.
```

### 6. detail

```
Vytvoř realistickou makro produktovou fotografii: detail moderní padel rakety (černý karbon s bordó akcenty) ležící na bordó (#8C1325) povrchu kurtu vedle žlutého padel míčku. Profesionální makro objektiv s mělkou hloubkou ostrosti. Boční dramatic light, kontrastní stíny. V neostrém pozadí náznak černých mantinelových sloupků a šedého koberce. Minimalist composition, prémiový sport equipment vibe. 16:9 widescreen.
```

---

## Jak se vrátit k Designu A

Pokud někdy budete chtít vrátit prompty k tomuto snapshotu:

1. Otevřít `web-app/src/lib/photo-prompts.ts`
2. Pro každý slot nahradit pole `prompt:` obsahem z příslušné sekce výše
3. Bumpnout verzi (PATCH) v `package.json`
4. Lint + restart dev serveru
5. Refreshnout `/admin/prezentace/[id]` — fotky sekce ukazuje původní prompty

Případně dát Claudovi instrukci: **"vrať Design A photos"** a tento soubor použije jako zdroj pravdy.
