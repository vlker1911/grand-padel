@AGENTS.md

# Grand Padel — instrukce pro Claude

## O projektu

Web aplikace pro síť indoor padel center Grand Padel.  
Pre-launch teaser — haly se otevírají od září/října 2026.  
Uživatel: Roman Vlk, začátečník bez zkušeností s kódem. Vše vysvětlovat jednoduše.

## Živé instrukce a stav projektu

Vždy si přečti před prací:
- `C:\Users\VlkR\Documents\grand-padel\instrukce\stav-projektu.md` — co je hotové, co chybí, aktuální verze
- `C:\Users\VlkR\Documents\grand-padel\README.md` — přehled projektu

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Font:** Inter (placeholder — finální font dodá grafik)
- **Hosting:** Vercel (zatím nenasazeno)
- **Databáze:** Supabase (Frankfurt)

## Brand barvy (placeholdery — finální dodá grafik)

- Bordó: `#801A28`
- Krémová: `#F2EDE4`
- Černá: `#0A0A0A`

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
