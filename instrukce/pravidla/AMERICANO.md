# Americano

## Princip
- **Rotující dvojice** — každý hráč hraje s jiným partnerem v každém kole
- Hraje se **na celkové body** (sjednaný limit: 16, 24, 32 atd.)
- **Individuální skóre** — hráč si veze body z každého zápasu, ne tým
- Cíl: kdo má nejvíc bodů po všech zápasech

## Skórování zápasu

### Princip: součet bodů obou týmů = limit
- Hra do **24 bodů:** typické skóre 12:12 (remíza), 16:8, 20:4, 24:0, atd.
- Hra do **32 bodů:** 16:16, 24:8, 32:0…
- Hra do **16 bodů:** 8:8, 12:4, 16:0…
- **Součet vždy = limit** (validační pravidlo)

### Validace skóre v aplikaci
- Pro limit `L`:
  - `s1 + s2 === L`
  - `0 ≤ s1 ≤ L`, `0 ≤ s2 ≤ L`
  - Auto-doplnění: zadáš s1=15, app dopočte s2=L-15
  - Cap při překročení: zadáš s1=99, capped na L
- **Remíza povolena** (např. 12:12 z 24)

## Pohyb dvojic

Pro N hráčů (N sudý):
- Kolo 1: A+B vs C+D, E+F vs G+H, ...
- Kolo 2: A+C vs B+D, ... (změna partnerů)
- Algoritmus: round-robin přes všechny páry

Aplikace používá funkci `generujAmericano(hraci, pocetKurtu)` v `src/lib/americano.ts`.

## Tabulka & pořadí

| Sloupec | Význam |
|---|---|
| **V** | Počet vyhraných zápasů |
| **R** | Počet remíz |
| **P** | Počet proher |
| **P+** | Součet získaných bodů ze všech zápasů |
| **P-** | Součet obdržených bodů |
| **+/-** | Rozdíl P+ a P- |

### Řazení:
1. **Vyhrané zápasy** (V) desc
2. **Body P+** desc (kdyby V byly stejné)
3. **+/-** desc

## Konec turnaje
- Po všech zápasech: tabulka určí pořadí
- Vítěz = hráč s nejvíce body P+
- Ohňostroj animace v aplikaci 

---

## Časté délky a počty hráčů

| Hráčů | Kurtů | Body / zápas | Čas/kolo | Celkový čas |
|---|---|---|---|---|
| 4 | 1 | 16 | ~10 min | ~50 min (5 kol) |
| 8 | 2 | 24 | ~12 min | ~85 min (7 kol) |
| 12 | 3 | 24 | ~12 min | ~130 min (11 kol) |
| 16 | 4 | 32 | ~15 min | ~3h (15 kol) |

> Počet kol = (N - 1) pro N hráčů (round-robin přes páry)
