# Turnaj

## Princip
- **Týmy** (páry hráčů) ve skupinách
- **Skupinová fáze** → každý s každým ve skupině (round-robin)
- **Playoff** (volitelné) → různé módy

## Tvorba týmů

### Typ párování
- **Pary** — uživatel zadá páry rovnou (2 hráči = 1 tým)
- **Jednotlivci** — zadá hráče, app je rozlosuje do párů
- **Mix** — kombinace (část hotových párů + jednotlivců dolosovaných)

### Gender-aware losování
- Pokud zadáno pohlaví (M/Ž):
  - Nejdřív páruje **M + Ž** (mix)
  - Zbytek páruje náhodně
- Pokud nezadáno: čistě náhodně

## Skupiny

### Počet skupin (vzorec)
```
pocetTymu ≤ 4  → 1 skupina
pocetTymu ≤ 8  → 2 skupiny
pocetTymu ≤ 12 → 3 skupiny
pocetTymu ≤ 16 → 4 skupiny
> 16          → ceil(N / 4) skupin
```

### Distribuce týmů
- Snake distribuce přes skupiny (snake = i % numSkupin)
- Pro lichý počet: některé skupiny mají o tým víc

### Skupinová fáze: round-robin
- Každý tým hraje **každý s každým** ve své skupině
- Pro skupinu N týmů: **N×(N-1)/2 zápasů**
  - 3 týmy: 3 zápasy
  - 4 týmy: 6 zápasů
  - 5 týmů: 10 zápasů

### Pořadí ve skupině
1. **Body** (V×2 + R×1) desc
2. **Rozdíl skóre** (+/-) desc
3. **Skóre** (P+) desc
4. Losování

---

## Formáty zápasu

### Gamy (do X gamů)

Aplikace nabízí: do 4, 5, 6 gamů (nebo vlastní).

**Tiebreak pravidla:**

#### Sudden death (DEFAULT) — "do X, tiebreak při X-1:X-1"
- Validní skóre: vítěz=X, poražený=0 až X-1
- Pro **do 6:** max 6:5 (žádný gam navíc)
- Pro **do 5:** max 5:4
- Pro **do 4:** max 4:3

#### Advantage — "do X, tiebreak při X:X → X+1:X"
- Validní skóre: vítěz=X, poražený=0 až X-2 NEBO vítěz=X+1, poražený=X
- Pro **do 6:** 6:0 až 6:4 (normální) nebo 7:6 (tiebreak)
- Pro **do 5:** 5:0 až 5:3 nebo 6:5

#### No tiebreak — "win by 2"
- Vítěz ≥ X, rozdíl ≥ 2 (neomezený)
- 6:4, 7:5, 8:6, 9:7…
- Praktické jen pro velmi krátké formáty

**Doporučení Grand Padel:** **Sudden death** — předvídatelná délka.

#### Validace v aplikaci (turnaj_zapasy)
```
if scoringTyp === "gamy" with sudden_death:
  s1 + s2 between L (e.g., 6) and 2L-1 (e.g., 11)
  max(s1, s2) === L
  s1 !== s2 (gamy nemůžou končit remízou)

if scoringTyp === "gamy" with advantage:
  Case 1: max(s1,s2) === L AND min(s1,s2) ≤ L-2
  Case 2: max(s1,s2) === L+1 AND min(s1,s2) === L
```

### Body (do X bodů)

- Stejně jako Americano: součet skóre = limit
- Pro **do 24:** maximum 24, vždy součet=24 (např. 12:12, 16:8)
- **Remíza povolena ve skupinách**, ne v playoff
- Validace:
  - `s1 + s2 === L`
  - `0 ≤ s1, s2 ≤ L`
  - V playoff: `s1 !== s2`

### Čas (X minut/kolo)

- Pevná délka kola, vše synchronizované
- Aplikace **spočítá délku kola automaticky** podle:
  ```
  kol = ceil(totalZapasu / pocetKurtu)
  delkaKola = floor((celkemMinut - (kol-1) × 3) / kol)
  ```
- Min. 10 min/kolo, max 60 min/kolo
- Pokud výpočet < 10 min: turnaj nelze stihnout → **BLOCK**
- Žádné maximum skóre (s1 a s2 mohou být cokoliv ≥ 0)
- V playoff: remíza zakázána

---

## Playoff módy

### Bez playoff
- Konečné pořadí podle skupin
- 0 zápasů navíc

### Final Four (medaile) — 4 zápasy
- **Top 4 týmy** (3 vítězové skupin + nejlepší 2. místo)
- Semifinále: 1A vs 4 (nejhorší ze 4), 2A vs 3 (křížové)
- Auto-gen: po dohraní semis → **Finále** + **O 3. místo**
- Maximum zápasů: **4** (2 semi + 1 finále + 1 o3)

### Single elimination (vítěz) — 1, 3, 7, 15 zápasů
- Top X týmů (X = 4, 8, 16) jdou do vyřazovacího pavouka
- Volba bracket size:
  - **Auto:** největší 2^k ≤ pocetTymu
  - **Top 4:** 3 zápasy (SF + F)
  - **Top 8:** 7 zápasů (QF + SF + F)
  - **Top 16:** 15 zápasů (R16 + QF + SF + F)
- **Žádný zápas o 3. místo**
- Auto-gen: vítěz každého kola → další kolo

### Multi-tier (umístění) — všichni hrají
- **Pásma po 4 týmech** (pásmo 1 = 1.-4. místo, pásmo 2 = 5.-8., …)
- Pro N týmů: ceil(N/4) pásem
- Každé pásmo: 2 semi + finále + o 3. místo = **4 zápasy**
- Pro 8 týmů: 2 pásma × 4 = **8 zápasů**
- Pro 12 týmů: 3 pásma × 4 = **12 zápasů**
- Nejvíc zápasů ze všech módů

---

## Konečné pořadí

### S playoff
- Pořadí podle finále + o 3. místo v každém pásmu
- Pro multi-tier: pásmo 1 = 1.-4., pásmo 2 = 5.-8., …
- Pro vitez: jen 1. (vítěz finále), 2. (poražený finále), 3.-4. (poražení semis)

### Bez playoff
- Sloučení skupinových tabulek
- Pořadí podle bodů, rozdílu, skóre

---

## Harmonogram (rozpis zápasů)

### Pro Čas formát
- **Synchronizovaná kola** — všechny kurty startují společně
- Kurt se přiřadí automaticky (greedy + round-robin reorder)
- Validace: žádný tým nehraje 2× v jednom kole

### Pro Gamy / Body
- **Fronta** — pořadové číslo #1, #2, …
- Kurt přiřadí **organizátor ručně** při kliku "Spustit"
- Modal zobrazí volné kurty
- Po dokončení: další zápas v pořadí

### Round-robin reorder (circle method)
- Pro každou skupinu se zápasy přepořádají do round-robin pořadí
- Mezi skupinami se interleavuje
- Eliminuje prostoje na kurtech

---

## Stavy turnaje

| Stav | Význam |
|---|---|
| `priprava` | (zatím nepoužíváme) |
| `probiha` | Turnaj běží |
| `ukonceno` | Hotovo nebo zrušeno |

Pokud `settings.zruseno === true` → turnaj byl ručně zrušen organizátorem.

## Stavy zápasu

| Stav | UI label | Význam |
|---|---|---|
| `ceka` | "Plánovaný" | Čeká ve frontě |
| `probiha` | "Probíhá" | Aktivně se hraje |
| `ukonceno` | (skóre) | Hotový |

Auto-stopa: `cas_zacatek` při Spustit, `cas_konec` při Uložit skóre.
