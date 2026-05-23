@AGENTS.md

# Grand Padel — instrukce pro Claude

## O projektu

Web aplikace pro síť indoor padel center Grand Padel.  
Pre-launch teaser — haly se otevírají od září/října 2026.  
Uživatel: Roman Vlk, začátečník bez zkušeností s kódem. Vše vysvětlovat jednoduše.

## Zásady UI

- **Žádné emoji v UI** — nikde v aplikaci nepoužívat emoji (ani v navigaci, tlačítkách, kartách, nadpisech). Výjimka pouze pokud uživatel explicitně požádá.

## Zásada: README a CLAUDE.md jsou rozcestníky, ne snapshots

Konkrétní fakta (HEX barvy, fonty, verze, stav projektu, otevřené úkoly) **patří do svého source-of-truth souboru**, ne do README/CLAUDE.md. README odkazuje, neuložuje.

**Source-of-truth pro typické věci:**
- Stav projektu, hotové funkce, verze → `web-app/instrukce/stav-projektu.md`
- Brand barvy → `vizual/barvy/paleta.md`
- Fonty → `vizual/typografie/fonty.md`
- Otevřené otázky → `otazky/otevrene-otazky.md`
- Pravidla turnajového enginu → `web-app/instrukce/turnaj-koncept.md` + pravidlo níže
- Pravidla her → `web-app/instrukce/pravidla/`

**Pravidlo pro Claude:**
1. Před prací na vizuálu/stavu projektu **vždy** otevři příslušný source-of-truth soubor — nespoléhej na to, co je napsané v README.
2. Po změně vizuálu/stavu **vždy** aktualizuj source-of-truth soubor (ne README).
3. Pokud najdeš v README nebo CLAUDE.md zastaralé tvrdé hodnoty (datované „Poslední aktualizace" víc než měsíc, hard-coded HEX/font), **upozorni uživatele** a navrhni převedení na rozcestník.

## Pravidla turnajového rozvrhu (engine `lib/turnaj-format.ts`)

Tato pravidla musí dodržet jakákoliv úprava enginu nebo plánovače zápasů:

1. **Maximální využití kurtů** — pokud máme N kurtů a v daný moment je více než 1 zápas k naplánování, musí běžet paralelně na různých kurtech. Žádný kurt nesmí stát nevyužitý, pokud na něj čeká zápas.
2. **Multi-tier playoff pásma běží paralelně** — když je playoff rozdělený na pásma (1.-4., 5.-8., …), pásma se rozdělí o dostupné kurty a hrají souběžně. Sekvenční plánování pásem je chyba.
3. **Finále čela (1.-4. / nejvyšší pásmo) je vždy poslední zápas turnaje** — všechny ostatní zápasy (skupinové, semifinále nižších pásem, o 3. místo, finále nižších pásem) musí skončit dřív než finále čela. Vyžaduje to rezervovat slot na finále čela jako poslední krok plánování.
4. **Žádný tým nehraje 2 zápasy zároveň** — engine musí kontrolovat, že tým má dostatek odpočinku mezi zápasy (minimálně 1 minuta, lépe víc). Pokud má tým konflikt, posunout pozdější zápas.
5. **Vyhrazený slot na finále** — i pokud playoff není multi-tier, finále hlavního bracketu je v ideálním případě posledním zápasem turnaje.

Při změnách enginu vždy spusť `web-app/scripts/test-turnaj-engine.mjs` (nebo ekvivalent) — testuje 50+ scénářů včetně lichých počtů týmů, různého počtu kurtů a všech playoff módů.

## Živé instrukce a stav projektu

Vždy si přečti před prací:
- `web-app/instrukce/stav-projektu.md` — co je hotové, co chybí, aktuální verze
- `web-app/instrukce/turnaj-koncept.md` — **DŮLEŽITÉ** pravidla turnajů, výpočty, edge cases (aktualizuj při změnách logiky turnajů)
- `web-app/instrukce/pravidla/` — **PRAVIDLA HER** (PADEL, AMERICANO, MEXICANO, TURNAJ). Při úpravě validace skóre nebo herní logiky vždy ověř proti pravidlům.
- `README.md` v root — přehled projektu

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Hosting:** Vercel (zatím nenasazeno)
- **Databáze:** Supabase (Frankfurt)

## Brand identita — kde jsou skutečné hodnoty

⚠️ **Nikdy nehard-codeuj barvy a fonty z paměti nebo z tohoto souboru.** Konkrétní hodnoty (HEX, fonty, váhy) drží jeden zdroj pravdy. Před prací s vizuálem si vždy načti:

- `C:\Users\VlkR\Documents\grand-padel\vizual\barvy\paleta.md` — aktuální HEX/RGB/Pantone všech brand barev
- `C:\Users\VlkR\Documents\grand-padel\vizual\typografie\fonty.md` — aktuální fonty a váhy
- `C:\Users\VlkR\Documents\grand-padel\vizual\README.md` — rozcestník, odkud se dostaneš dál

Pokud měníš brand v kódu (`globals.css`, `lib/brand.ts`, apod.), nejdřív ověř proti těmto souborům. Když najdeš nesoulad (kód říká X, paleta říká Y), **paleta vyhrává** a kód se upravuje.

## Struktura souborů

```
src/
  app/
    layout.tsx          — sdílený layout, font, metadata
    page.tsx            — homepage
    o-nas/page.tsx
    kontakt/page.tsx
    rezervace/page.tsx  — teaser
    turnaje/page.tsx    — teaser
    akademie/page.tsx   — teaser
  components/
    Navbar.tsx          — navigace + logo
    MobileMenu.tsx      — hamburger menu
    PageHero.tsx        — sdílená hero sekce
```

## Pravidla pro nové stránky

- Rezervace, turnaje, akademie = teaser "brzy otevřeno" — **ne** funkční systém
- Haly nejsou otevřené, nepsat jako by fungovaly
- Každá stránka má `<Navbar />` nahoře a `<footer>` dole s verzí

## Verzování — povinné při každé změně

Po každé změně v projektu Claude musí:

1. **Zvýšit verzi** v `package.json`:
   - Oprava chyby → patch (0.1.0 → 0.1.1)
   - Nová stránka nebo komponenta → minor (0.1.0 → 0.2.0)
   - Velká změna struktury → major (0.1.0 → 1.0.0)

2. **Aktualizovat** `C:\Users\VlkR\Documents\grand-padel\instrukce\stav-projektu.md`:
   - Verze a datum
   - Tabulka Historie verzí
   - Stav funkčnosti (co přibylo/změnilo se)

3. **Git commit** s popisem změny:
   ```
   git add .
   git commit -m "popis co se změnilo (v0.X.X)"
   git tag v0.X.X
   git push && git push --tags
   ```

## Zobrazení verze v aplikaci

Verze se zobrazuje v patičce každé stránky.  
Zdroj: proměnná prostředí `NEXT_PUBLIC_APP_VERSION` (nastavena v `next.config.ts` z `package.json`).

## Kam zapisovat poznámky

- Denní zápisy → `C:\Users\VlkR\Documents\grand-padel\denik\YYYY-MM-DD-nazev.md`
- Rozhodnutí → `C:\Users\VlkR\Documents\grand-padel\rozhodnuti\`
- Otázky → `C:\Users\VlkR\Documents\grand-padel\otazky\`
