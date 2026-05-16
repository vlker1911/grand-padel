# Pravidla her — Grand Padel

Tato složka obsahuje **kompletní pravidla** pro všechny formáty her v Grand Padel.

> **DŮLEŽITÉ:** Vždy si přečti relevantní pravidla **PŘED** úpravou validační nebo herní logiky.

## Soubory

| Soubor | Co obsahuje |
|---|---|
| [PADEL.md](PADEL.md) | Základní pravidla padelu, tiebreak, sets, gam |
| [AMERICANO.md](AMERICANO.md) | Pravidla Americana — rotující dvojice, individuální body |
| [MEXICANO.md](MEXICANO.md) | Pravidla Mexicana — pohyb po kurtech, na čas |
| [TURNAJ.md](TURNAJ.md) | Pravidla turnaje — skupiny, playoff módy, formáty zápasů |

## Souvislosti s kódem

| Pravidlo | Soubor v kódu | Funkce |
|---|---|---|
| Generování zápasů Americana | `src/lib/americano.ts` | `generujAmericano()` |
| Tabulka Americana | `src/lib/americano.ts` | `spocitejTabulku()` |
| Tabulka skupin | `src/app/hry/[id]/page.tsx` | `skupinaTabulka()` |
| Generování playoff | `src/app/hry/[id]/page.tsx` | `generujPlayoff()` |
| Auto-gen kola playoff | `src/app/hry/[id]/page.tsx` | `ulozSkore()` |
| Harmonogram (sync rounds) | `src/app/hry/[id]/page.tsx` | `spocitejHarmonogram()` |
| Round-robin reorder | `src/app/hry/[id]/page.tsx` | `reorderRoundRobin()` |
| Validace skóre Americano | `src/app/hry/[id]/page.tsx` `AmericanoView` | `updateScore()`, `ulozSkore()` |
| Validace skóre Turnaj | `src/app/hry/[id]/page.tsx` `TurnajView` | `updateScore()`, score validation in `renderZapas()` |
| Wizard turnaj kalkulátor | `src/app/hry/nova/page.tsx` | `calculateWizardVariant()`, `generateWizardVariants()` |

## Validační konvence

Pro každou validaci skóre platí:
1. **Cap na vstupu** — uživatel nemůže napsat víc než limit
2. **Validace při ukládání** — `ulozSkore()` vrátí early bez uložení, pokud neplatné
3. **Vizuální feedback** — chybová hláška pod inputem ("Soucet musi byt X")

## Změny při úpravě pravidel

**Vždy aktualizuj:**
1. Příslušný soubor v `pravidla/`
2. Validační logiku v `src/`
3. Test 20 scénářů ručně
4. Aktualizuj `turnaj-koncept.md` pokud se týká turnaje
5. Aktualizuj `stav-projektu.md` v hist. verzí
