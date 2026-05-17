# Stav projektu Grand Padel

> Tento soubor se automaticky aktualizuje při každé změně v projektu.
> Vždy odráží aktuální stav — co funguje, co chybí, jaká je verze.

---

## Verze

**Aktuální:** v0.8.1  
**Poslední změna:** 17. 5. 2026  
**Git tag:** v0.8.1

### Historie verzí

| Verze | Datum | Co přibylo |
|---|---|---|
| v0.8.1 | 17. 5. 2026 | **Fix turnajového rozvrhu** — engine teď využívá VŠECHNY kurty paralelně. Multi-tier playoff pásma běží souběžně na rozdělených kurtech (pásmo 1.-4. + pásmo 5.-8. paralelně místo sekvenčně). Finále čela rezervováno jako **poslední zápas turnaje**. Kontrola konfliktu týmů (tým nehraje 2× najednou + pauza). Test runner `scripts/test-turnaj-engine.mjs` (61 scénářů vč. lichých počtů, různých kurtů, všech playoff módů — všechny procházejí). Pravidla zapsána do `web-app/CLAUDE.md`. Příklad: 8 týmů + 4 kurty + multi-tier zkrátilo turnaj z 2h26min na 1h47min |
| v0.8.0 | 17. 5. 2026 | **Konfigurovatelný turnaj + auto-rozplánovač.** Nový `lib/turnaj-format.ts` engine: round-robin (circle method), playoff (medaile/single elim/multi-tier), útěchový pavouk, kalkulátor časů s podporou různých délek skupina/semi/finále. Po vytvoření turnaje se rozvrh **skupinových zápasů** ukládá do `turnaj_zapasy` rovnou s `cas_zacatek`, `cas_konec`, `kurt`, `kolo` (playoff se dál generuje po dohrání skupin). Wizard rozšířen o krok 5 **Preview** (kompletní tabulka rozvrhu vč. playoff s placeholdery), toggle útěchového pavouka a vlastní délky zápasů. Šablony rychlého startu v kroku 1: Klasický 4-týmový, Big 6 týmů, Drabinka 8 týmů, Sociální round robin |
| v0.7.18 | 17. 5. 2026 | **Filtr na /hry** — přepínač Aktivní / Ukončené / Zrušené / Vše s počty. Defaultně "Aktivní" (priprava + probiha bez zrušení) |
| v0.7.17 | 17. 5. 2026 | **Mazání všech typů her** — `lib/hry.ts` se sdílenou funkcí `smazatHru()` mažící podle FK pořadí pro turnaj i americano/mexicano/mixano (včetně `hra_skupiny`, `hra_skupiny_ucastnici`, `hra_editatori`). Detail hry: tlačítko "Smazat trvale" vždy pro editora (mimo zrušený turnaj — tam stále v banneru), modal ukazuje počet účastníků a zápasů + povinný checkbox potvrzení. Seznam `/hry`: ikonka koše vedle stavu pro editora, stejný modal |
| v0.7.16 | 16. 5. 2026 | **Mexicano persistence** — kola se ukládají do `hra_zapasy` (předtím vše v `useState`, F5 ztratilo data). Init kola 1 vloží do DB, výsledky a nové kola se ukládají. `kola` se odvozuje z DB přes useMemo |
| v0.7.15 | 16. 5. 2026 | **Oprava advantage gamy**: 7:5 (win by 2 po 5:5→6:5→7:5) je teď validní. Tři možné výsledky pro advantage: normalWin (6:0–6:4), winByTwo (7:5), tiebreakWin (7:6) |
| v0.7.14 | 16. 5. 2026 | **Pravidla her** ([instrukce/pravidla/](pravidla/)) PADEL/AMERICANO/MEXICANO/TURNAJ. Gamy tiebreak validace (sudden_death/advantage), audit fixes: finalniPoradi pro vitez s víc kolama, auto-gen pro malá pásma, `hra.stav=ukonceno` po dokončení |
| v0.7.13 | 16. 5. 2026 | **Wizard** v krok 1 turnaje — tlačítko "Doporuč variantu", modal se 3 doporučeními (Optimální/Max zápasů/S rezervou) z 200+ kombinací (1-10 kurtů × 4 playoff × 7 formátů). Klikem se vyplní celý formulář |
| v0.7.12 | 16. 5. 2026 | 3 bug fixy: (1) Americano validace skóre (cap na limit, kontrola součtu = limit), (2) Single elim volba bracket size (auto/top4/top8/top16), (3) Harmonogram round-robin pořadí v skupině (circle method) → 4 kola místo 6 pro 8 týmů + 3 kurty |
| v0.7.11 | 16. 5. 2026 | Turnaj **3 playoff módy** (medaile/vitez/umisteni) + bez. generujPlayoff a auto-gen pro každý mód, Single elim s top 2^k, migrace ze starých settings. Otestováno 20 scénářů |
| v0.7.10 | 16. 5. 2026 | Turnaj odhad: oprava pro lichý počet týmů + n%4≠0 v multi-tier (poslední pásmo nemá vždy 4 týmy → ne 4 zápasů). Non-multi-tier s pocetSkupin≥3 jen first round. Testováno 20 scénářů |
| v0.7.9 | 16. 5. 2026 | Turnaj validace: detailní rozpis časů ve varovném banneru — kolik na skupiny, kolik na playoff, přesný počet kol, chybějící čas. Testováno 6 scénářů ručně |
| v0.7.8 | 16. 5. 2026 | Turnaj: 4 opravy — (1) KRITICKÉ: harmonogram nedělal kontrolu konfliktu týmů (tým hrál 2× v jeden čas), (2) Rozlosovat tlačítko v krok 4 (random Fisher-Yates), (3) Editor jmen hráčů v Hráči tabu, (4) Playoff placeholdery v Pořadí zápasů ("1A vs 4B") |
| v0.7.7 | 16. 5. 2026 | Turnaj: kompletní bracket — semifinále (kolo=1) + auto-generované finále & o 3. místo (kolo=2) po dohrání obou semis. Pro 8 týmů multi-tier teď 20 zápasů (12 sk + 8 pl). Konečné pořadí podle finále/o3 |
| v0.7.6 | 16. 5. 2026 | Turnaj: opraven odhad počtu zápasů pro playoff (sedí s tím co generujPlayoff vytvoří, ne 18 ale 16 pro 8 týmů multi-tier) → reálné kolo 12 min místo 10 |
| v0.7.5 | 16. 5. 2026 | Turnaj: validace času bere počet týmů z formuláře (nečeká na vyplnění), Pořadí zápasů bez matoucích auto-kurtů, Spustit zápas tlačítko v Pořadí i Rozlosování |
| v0.7.4 | 16. 5. 2026 | Turnaj: bug fix — Smazat tiše selhalo (chybělo RLS DELETE), přidány policies pro hry/hra_ucastnici/hra_zapasy, error handling v smazatTurnaj, /hry list rozlišuje "Zrušeno" |
| v0.7.3 | 16. 5. 2026 | Turnaj: manuální výběr kurtu pro gamy/body při Spustit zápas (modal s obsazenými kurty), auto-stopa `cas_zacatek`/`cas_konec`/`vitez_id`. Dokumenty přesunuty do `web-app/instrukce/` (verzované) |
| v0.7.2 | 16. 5. 2026 | Turnaj: HARD BLOCK Pokračovat pro gamy/body co se nevejdou do času (původně jen warning), Pořadí zápasů přepracováno — pro gamy/body fronta bez fixních časů, pro Čas synchronizovaná kola s časy |
| v0.7.1 | 16. 5. 2026 | Turnaj: smazat trvale, auto-výpočet kola pro Čas (skryt input), validace gamy/body se nevejdou → doporučí Čas, režim kurtů selector (auto/1-1/2-1), edit názvu/času/kurtů. Persistentní [turnaj-koncept.md](turnaj-koncept.md) |
| v0.7.0 | 16. 5. 2026 | Turnaj: 6-tabová struktura (Info, Rozlosování, Pořadí zápasů, Tabulky, Scoreboard, Hráči), filtr skupin, vyhledávání týmů/hráčů, editor popisu a pravidel |
| v0.6.2 | 16. 5. 2026 | Turnaj: validace skóre (body auto-dopočet, gamy/cas pravidla), stavy zápasů (Plánovaný/Probíhá/Odehraný) + Spustit zápas, zrušení turnaje s důvodem |
| v0.6.1 | 16. 5. 2026 | Formuláře: jednotně jen jedno pole (žádné quick tlačítka 4/5/6, 10/12/15…), oprava propagace času na souhrn (25 min už nepíše "bodu") |
| v0.6.0 | 16. 5. 2026 | Audit projektu: odstranění všech emoji z UI (lucide-react ikony), sjednocení Instagram @grandpadelcz, footer s verzí na /prihlaseni, auth guard na /hry/nova |
| v0.5.5 | 16. 5. 2026 | Turnaj: volba "Název týmu / Jména hráčů" — jedno pole místo dvou jmen, lepší error messages při ukládání |
| v0.5.4 | 16. 5. 2026 | Turnaj krok 1: počet párů jako jedno pole s počtem hráčů vedle, formát zápasu Gamy/Body/Čas, gamy 4/5/6, playoff jen Ano/Ne |
| v0.5.3 | 16. 5. 2026 | Turnaj: pole počtu párů/hráčů v kroku 1 — předvyplní správný počet řádků, podpora pro pary/singles/mix |
| v0.5.2 | 16. 5. 2026 | Turnaj: harmonogram kurtů (fronta, odhadované časy), konečné pořadí, ohňostroj s vítězem turnaje |
| v0.5.1 | 16. 5. 2026 | Turnaj: živý dashboard — skupinové tabulky (V/R/P/Skore/+/-), zadávání výsledků, generování playoff po dokončení skupin |
| v0.5.0 | 16. 5. 2026 | Turnaj: 4-krokový formulář pro tvorbu turnaje (pary/singles/mix, scoring gamy/body, playoff, multi-tier), gender-aware losování, skupiny preview, Supabase zápis (turnaj_tymy + turnaj_zapasy) |
| v0.4.3 | 16. 5. 2026 | Americano: inline zadávání skóre, W/R/P/P+/P-/+/- tabulka, ohňostroj s pořadím při zakončení |
| v0.3.9 | 16. 5. 2026 | Herní centrum: opravy chyb — správný výpočet max kol (hra+přesun), oprava `autoKolo` ref v nova/page.tsx, oprava `vsichniHraci` ref v [id]/page.tsx |
| v0.3.x | 16. 5. 2026 | Herní centrum: Mexicano s odpočtem, pohyb hráčů po kurtech, autocomplete z návrhů, limit kol dle času, Americano auto-skóre a tabulka |
| v0.2.0 | 15. 5. 2026 | Reálné fotky a video: hero video (hero.mp4), 3 arena karty (padel1–3.png), 3 IG příspěvky (ig1–3.png), přihlašování (Google + email + heslo), Supabase Auth, NavbarAuth |
| v0.1.0 | 15. 5. 2026 | Základní web: homepage, o nás, kontakt, rezervace/turnaje/akademie (teaser), mobilní menu, kontaktní formulář přes Resend |

---

## Web aplikace (`web-app/`)

### Co funguje

| Stránka | URL | Stav |
|---|---|---|
| Homepage | `/` | ✅ Hotovo |
| O nás | `/o-nas` | ✅ Hotovo |
| Kontakt | `/kontakt` | ✅ Hotovo — formulář odesílá přes Resend |
| Rezervace | `/rezervace` | ⏳ Teaser "brzy otevřeno" |
| Turnaje | `/turnaje` | ⏳ Teaser "brzy otevřeno" |
| Akademie | `/akademie` | ⏳ Teaser "brzy otevřeno" |

### Komponenty

- `Navbar` — navigace, logo, mobilní hamburger menu ✅
- `MobileMenu` — mobilní menu ✅
- `PageHero` — sdílená hero sekce pro podstránky ✅
- `NavbarAuth` — přihlášení/odhlášení v navbaru, zobrazuje email přihlášeného uživatele ✅
- `Footer` — patička se zobrazením verze aplikace ✅ (v každé stránce)

### Co ještě chybí

- Deploy na Vercel (čeká na schválení od Pepy — jednatele)
- Resend domain verification (čeká na přístup k DNS grandpadel.cz)
- Apple login (plánováno srpen/září 2026, potřeba Apple Developer účet $99/rok)
- Rezervační systém — UI a logika
- Finální brand barvy od grafika (placeholder: bordó #801A28, krémová #F2EDE4)
- Finální logo — čeká se na SVG od grafika

---

## Databáze (Supabase)

### Stav tabulek

| Tabulka | Stav |
|---|---|
| `pobocky` | ✅ Vytvořena, naplněna daty (Olomouc, Ostrava, Praha Zličín) |
| `kurty` | ✅ Vytvořena, naplněna daty (7+8+10 kurtů) |
| `cenik` | ✅ Vytvořena, naplněna daty (špička/mimo špičku/víkend) |
| `oteviraci_doba` | ✅ Vytvořena, naplněna daty (Po–Ne pro každou pobočku) |
| `hry` | ✅ Vytvořena (s `settings jsonb`) — Americano, Mexicano, Turnaj |
| `hra_ucastnici` | ✅ Vytvořena — hráči ke hře (36+ řádků) |
| `hra_zapasy` | ✅ Vytvořena — zápasy (kola, skóre). **Mexicano persistuje sem (v0.7.16)** |
| `hra_editatori` | ✅ Vytvořena — editoři hry kromě vlastníka |
| `turnaj_tymy` | ✅ Vytvořena — týmy turnaje (s názvy + hráči) |
| `turnaj_zapasy` | ✅ Vytvořena — zápasy turnaje (skupiny + playoff) |
| `hra_skupiny` | 🟡 Vytvořená, nepoužitá (zatím) |
| `hra_skupiny_ucastnici` | 🟡 Vytvořená, nepoužitá (zatím) |
| `contact_messages` | ✅ Vytvořená — kontaktní formulář |
| `profily` | ⏳ Naplánováno — napojení na Supabase Auth |
| `rezervace` | ⏳ Naplánováno — rezervační systém |
| `blokace` | ⏳ Naplánováno — blokace kurtů (údržba apod.) |
| `platby` | ⏳ Naplánováno |
| `kredity` | ⏳ Naplánováno |

### RLS policies (manuálně v Supabase Dashboardu)

| Tabulka | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `hry` | public | auth.uid()=created_by | created_by=auth.uid() | created_by=auth.uid() ✅ (v0.7.4) |
| `hra_ucastnici` | public | true | (chybí?) | EXISTS hra owner ✅ (v0.7.4) |
| `hra_zapasy` | public | true | hra owner OR editor | hra owner ✅ (v0.7.4) |
| `turnaj_tymy` | public | hra owner | hra owner OR editor | hra owner ✅ (v0.5.1) |
| `turnaj_zapasy` | public | hra owner OR editor | hra owner OR editor | hra owner ✅ (v0.5.1) |

---

## Nástroje a prostředí

| Nástroj | Verze / stav |
|---|---|
| Node.js | v24.15.0 |
| npm | 11.12.1 |
| Next.js | 16.2.6 |
| Claude Desktop | MCP desktop-commander nastaveno (15. 5. 2026) |

---

## Další kroky (v pořadí priority)

### Web základ
1. ✅ Kontaktní formulář — Resend, posílá na info@grandpadel.cz
2. ✅ Databáze Supabase — tabulky, naplněna daty
3. ✅ Přihlašování — email + heslo + Google
4. ✅ Instagram sekce + reálné fotky
5. ⏳ Rezervační systém — UI výběr termínu a kurtu, logika
6. ⏳ Deploy na Vercel — po schválení Pepou
7. ⏳ Resend domain verification — po přístupu k DNS grandpadel.cz
8. ⏳ Apple login — srpen/září 2026

### Herní centrum — co dál (po v0.8.0)

**🔴 Vysoká priorita — bezprostředně po testu v0.8.0:**
- **Otestovat v0.8.0 v prohlížeči** — vytvořit šablonou turnaj, projít wizard, ověřit preview, zkontrolovat že do `turnaj_zapasy` se uloží skupinové zápasy s časy a kurty
- **Spustit RLS migraci** `instrukce/migrace/2026-05-17-rls-delete-policies-her.sql` v Supabase SQL Editor (MCP je read-only, manuální krok)
- **Playoff zápasy v DB s časy + auto-propagace vítězů** — engine `lib/turnaj-format.ts` je už generuje, ale vkládáme do DB jen skupinové, aby se neduplikovaly s existující generací v `TurnajView`. Refaktor: vložit playoff hned (s `tym1_id=null` placeholdery), a po dohrání semi automaticky doplnit `tym1_id`/`tym2_id` ve finále. Vyžaduje úpravu `TurnajView` (řádky 1359-1400).
- **Útěchový pavouk do DB** — stejný princip jako playoff (engine to umí, UI v preview ukáže, ale do DB se nevkládá)
- **`TurnajView` zobrazení nových fází** — engine vrací `semifinale`, `finale`, `o_3_misto`, `ctvrtfinale`, `utech_*`; současný kód má hardcoded `faze === "playoff"` na několika místech (1948, 1982, 2052, 2389)

**🟠 Střední:**
- **Veřejný read-only pohled** — sdílecí URL pro hráče bez přihlášení, schovat editor controls
- **Implementace režimu kurtů** (auto/1-1/2-1) v plánování — setting se ukládá, engine ho zatím nepoužívá
- **Obnovit zrušený turnaj** — tlačítko v UI chybí
- **Odebrat tým** z turnaje — UI chybí
- **`window.location.reload()`** → `nactiTurnaj()` (ztrácí state)
- **Editace formátu/scoring** po vytvoření turnaje
- **Dead vars cleanup** (`playoff`, `multiTier`, `typPlayoff` redundantní s `playoffMode`; `wizardKurtu`)
- **Mexicano `body_na_zapas` rename** na `minut_na_kolo` (kolize sémantiky)
- **Mexicano tabulka individuálních výsledků** (kdo má kolik vítězství)
- **Garance odpočinku** (15 min mezi zápasy téhož týmu) — engine to zatím neřeší
- **Pre-existing lint errors** `react-hooks/set-state-in-effect` v `[id]/page.tsx:1191,2569` a `nova/page.tsx:443` — můžou rozbít `next build` v CI

**🟢 Budoucí:**
- **Export PDF** kompletního turnaje
- **QR kód** pro sdílecí URL
- **Hromadný import týmů** (CSV/paste)
- **Notifikace hráčům** ("Tvůj zápas za 10 min")
- **Statistiky hráčů** (win rate, ranking)
- **Live timer** pro Čas formát
- **Křížový playoff jako samostatná volba** (dnes "medaile" v engine dělá 1A vs 2B / 1B vs 2A pro 2 skupiny, jinak 1v4/2v3 — sjednotit do explicitního přepínače "klasický pavouk vs křížový")

### Známé bugy / TODO

- Race condition při init Mexicano kola 1 (2 uživatelé současně) — málo pravděpodobné
- Non-multi-tier playoff s 6+ týmy v playoff: jen first round, žádné finále se neauto-generuje
- Lichý počet hráčů v Mexicanu: jen `floor(n/4)×4` hraje, zbytek nehraje

## Rozhodnutí

- Přihlašování: email + heslo, Google, Apple
- Instagram: feed posledních příspěvků na homepage + odkaz na profil
- Platby: přeskočeny (zatím), rezervace funguje bez online platby
- Databázové tabulky: 10 (původní 7 + platby, kredity, contact_messages)
