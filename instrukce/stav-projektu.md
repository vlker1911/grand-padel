# Stav projektu Grand Padel

> Tento soubor se automaticky aktualizuje při každé změně v projektu.
> Vždy odráží aktuální stav — co funguje, co chybí, jaká je verze.

---

## Verze

**Aktuální:** v0.5.0  
**Poslední změna:** 16. 5. 2026  
**Git tag:** v0.5.0

### Historie verzí

| Verze | Datum | Co přibylo |
|---|---|---|
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
| `hra_ucastnici` | ✅ Vytvořena — hráči ke hře |
| `hra_zapasy` | ✅ Vytvořena — zápasy (kola, skóre) |
| `profily` | ⏳ Naplánováno — napojení na Supabase Auth |
| `rezervace` | ⏳ Naplánováno — rezervační systém |
| `blokace` | ⏳ Naplánováno — blokace kurtů (údržba apod.) |

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

1. ✅ Kontaktní formulář — Resend, posílá na info@grandpadel.cz
2. ✅ Databáze Supabase — tabulky, naplněna daty (pobočky, kurty, ceník, otevírací doba)
3. ✅ Přihlašování — email + heslo + Google (Supabase Auth), NavbarAuth komponenta
4. ✅ Instagram sekce — 3 příspěvky, odkaz na @grandpadelcz, reálné fotky
5. ✅ Reálné fotky a video — hero.mp4, padel1–3.png, ig1–3.png
6. Rezervační systém — UI výběr termínu a kurtu, logika, rozhraní pro zákazníka
7. Deploy na Vercel — po schválení Pepou
8. Resend domain verification — po přístupu k DNS grandpadel.cz
9. Apple login — srpen/září 2026

## Rozhodnutí

- Přihlašování: email + heslo, Google, Apple
- Instagram: feed posledních příspěvků na homepage + odkaz na profil
- Platby: přeskočeny (zatím), rezervace funguje bez online platby
- Databázové tabulky: 10 (původní 7 + platby, kredity, contact_messages)
