# Pravidla padelu — základ

## Základní zápas (formální / klubový)

### Skórování bodů v hře (game)
- 0 → 15 → 30 → 40 → hra
- Při 40:40 ("deuce"):
  - **Klasická pravidla:** Hraje se výhoda — kdo získá 2 body za sebou, vyhrává hru
  - **Padel pravidla (no-ad):** Rozhodující bod ("zlatý bod") — kdo získá 41. bod, vyhrává hru
  - **Český padel obvykle používá NO-AD**

### Vítězství v sadě (set)
- **Klasická sada:** první tým na **6 gamů** s rozdílem alespoň 2 (např. 6:0 až 6:4)
- Když je 6:6 → **tiebreak**
- **Tiebreak (klasický):** první na 7 bodů s rozdílem 2 — výsledek sady 7:6
- **Super tiebreak (do 10):** používá se místo 3. sady, první na 10 s rozdílem 2

### Délka zápasu
- **Best of 3 sady** — standardní profesionální zápas
- **Pro-set** — zkrácená verze, jedna delší sada (např. do 9 gamů)

---

## Sudden death tiebreak (zlatý gam)

Méně formální / komunitní turnaje často používají:
- "Do X gamů, **5:5 tiebreak**" → max výsledek X:X-1
- Žádný odděleny tiebreak — rozhodující gam se hraje jako normální gam
- Pro 6 gamů: 5:5 → rozhodující 6. gam → výsledek 6:5
- Pro 5 gamů: 4:4 → rozhodující 5. gam → výsledek 5:4
- **Výhoda:** kratší a předvídatelnější délka zápasu

---

## Validace skóre — co je platné

### Variant A: "Advantage tiebreak" (do X, tiebreak při X:X)
Validní skóre:
- Vítěz `X`, poražený `0` až `X-2` (např. do 6: 6:0, 6:1, 6:2, 6:3, 6:4)
- Vítěz `X+1`, poražený `X` (tiebreak: 7:6)
- **Maximum:** X+1:X

### Variant B: "Sudden death tiebreak" (do X, tiebreak při X-1:X-1)
Validní skóre:
- Vítěz `X`, poražený `0` až `X-1` (např. do 6: 6:0, 6:1, ..., 6:5)
- **Maximum:** X:X-1
- Žádný 7:6 — sada končí dříve

### Variant C: "Win by 2, no tiebreak"
Validní skóre:
- Vítěz ≥ `X`, rozdíl ≥ 2 (např. 6:4, 7:5, 8:6, 9:7, 10:8…)
- **Maximum:** neomezeno (teoreticky)
- V praxi se málokdy hraje takhle dlouho

---

## Doporučení pro Grand Padel turnaje

| Formát | Tiebreak rule | Maximum skóre | Výhody |
|---|---|---|---|
| **Do 6 gamů** | Advantage (6:6) | 7:6 | Standardní padel set |
| **Do 6 gamů** | Sudden death (5:5) | 6:5 | Rychlé, předvídatelné |
| **Do 5 gamů** | Sudden death (4:4) | 5:4 | Krátké zápasy, vhodné pro turnaje s mnoha týmy |
| **Do 4 gamů** | Sudden death (3:3) | 4:3 | Velmi krátké, pro rychlé turnaje |

**Pro Grand Padel doporučení (default):** **Sudden death** — předvídatelný čas zápasu, jednoduchá validace.

---

## Bodový systém v zápase

- **Vítězství:** 2 body do tabulky (sport. úmluva)
- **Remíza:** 1 bod každému týmu (jen pokud je formát dovolí — body / čas)
- **Prohra:** 0 bodů

V Grand Padel app je toto v `skupinaTabulka()` v `src/app/hry/[id]/page.tsx`.

---

## Skórování — naše konvence

| Sloupec v tabulce | Význam |
|---|---|
| **V** | Výhry |
| **R** | Remízy (jen pro body/čas, ne pro gamy) |
| **P** | Prohry |
| **Skóre** (P+) | Získané body / gamy / minuty (souhrnně "skóre") |
| **Obdrzeno** (P-) | Body / gamy obdržené od soupeře |
| **+/-** (rozdíl) | Skóre - obdrzeno |
| **Body** | Celkové body do tabulky (V×2 + R×1) |

**Pořadí ve skupině:** body desc → rozdíl desc → skóre desc → losování
