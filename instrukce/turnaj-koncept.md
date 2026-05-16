# Turnaj — koncepční dokument

> Trvalý dokument o tom, jak má turnaj fungovat. Pravidla, výpočty, edge cases.
> Aktualizuj při každé změně herní logiky. Sem se vrátíme, když ztratíme kontext v konverzaci.

---

## 1. Formáty zápasu

| Formát | Jak vyhrát | Limit | Remíza? |
|---|---|---|---|
| **Gamy** | První tým s X gamy vyhrává | 4 / 5 / 6 / vlastní | Není povolena |
| **Body** | Součet skóre = X (rozdělení) | 16 / 24 / 32 / vlastní | Možná (např. 12:12 z 24) |
| **Čas** | Po X minutách, vyšší skóre vyhrává | Spočítá se automaticky (viz níže) | Ve skupinách ano, v playoff ne |

### Pravidlo pro Čas
- Kolo má 10-60 minut (jinak chyba).
- Délka kola NENÍ uživatelský vstup — počítá ji systém.

---

## 2. Výpočet kola (Čas formát)

```
celkemMinut = casDo - casOd
celkemZapasu = pocetZapasuSkupin + (playoff ? pocetZapasuPlayoff : 0)
poctyKol = ceil(celkemZapasu / pocetKurtu)
rezervaNaPrechod = 3 min (mezi koly)
delkaKola = floor((celkemMinut - (poctyKol - 1) * rezervaNaPrechod) / poctyKol)

if delkaKola < 10 → CHYBA: turnaj nelze stihnout
if delkaKola > 60 → cap na 60 (zbytek je rezerva)
```

### Příklad
- 8 týmů, 2 skupiny po 4, 6 zápasů skupin + 4 zápasy playoff = 16 zápasů
- 2 kurty → 8 kol synchronně
- Čas 16:00–18:00 = 120 min
- (120 - 7*3) / 8 = 99 / 8 = 12 min/kolo → OK

---

## 3. Validace času pro Gamy / Body

Když uživatel zvolí gamy nebo body, systém spočítá odhad:

```
odhadNaZapas (gamy) = scoringLimit * 3 + 5  // např. 6 gamů = 23 min
odhadNaZapas (body) = round(scoringLimit * 0.45) + 5  // např. 24 b = ~16 min
celkemZapasu = (jako u času)
celkemMinut = ceil(celkemZapasu / pocetKurtu) * (odhadNaZapas + 3 rezerva)

if celkemMinut > (casDo - casOd) → HARD BLOCK:
  - Pokracovat tlacitko disabled
  - Banner: "Turnaj nelze stihnout"
  - Nabidneme: prodlouz cas / pridej kurty / prepnout na Cas
```

### Důležité rozdíly mezi formáty:
- **Čas:** kola jsou synchronizovaná — všechny kurty startují společně, končí společně. Lze predikovat časy.
- **Gamy/Body:** queue-based — kurty se uvolňují různě, jedna skupina může trvat déle (např. 6:0 vs 7:6 v tiebreaku). **Časy nelze predikovat — zobrazujeme jen pořadí #1, #2, …**

### Display v "Pořadí zápasů" tab:
- **Čas:** ukazujeme po kurtech s fixními časy (synchronizovaná kola)
- **Gamy/Body:** flat fronta s pořadovým číslem #1, #2, … BEZ auto-přiřazení kurtu. Organizátor klikne "Spustit" → modal s volnými kurty → vybere → uloží `z.kurt`, `z.cas_zacatek`. Kurt se ukáže až poté.

### Konflikt týmů v synchronizovaných kolech (v0.7.8)
- `spocitejHarmonogram` musí v každém kole zajistit, že **žádný tým nehraje 2×**.
- Algoritmus: greedy per round — pro každý kurt vyber první zápas, jehož oba týmy nejsou v `teamsThisRound`. Pokud žádný nevyhovuje, kurt je idle v daném kole.

### Round-robin reorder (v0.7.12)
- Před greedy schedulingem: pro každou skupinu přepořádej zápasy do **round-robin (circle method)**:
  - Pro 4 týmy [T1,T2,T3,T4]: 3 kola po 2 zápasech — (T1,T4)(T2,T3) | (T1,T3)(T4,T2) | (T1,T2)(T3,T4)
- Pak **interleave** mezi skupinami (1 z každé skupiny po kole).
- Pro lichý počet týmů ve skupině: BYE → skip zápasy s BYE.
- Výsledek: dramaticky méně kol, kurty se nepřevažují idle (např. 4 kola místo 6 pro 8 týmů, 2 skupiny, 3 kurty).

### Random losování do skupin (v0.7.8)
- `rozdelDoSkupin` distribuuje snake-style (`i % numSkupin`) — pro POŘADÍ vstupu dělá alternaci 1A,1B,2A,2B,...
- Aby skupiny byly opravdu random: před distribucí použít `shuffleArray` (Fisher-Yates)
- V krok 4 souhrn je tlačítko "Rozlosovat" / "Rozlosovat znovu" — uloží do `losovaneTymy` shuffled array
- `vytvorHru` použije `losovaneTymy ?? efektivniTymy`

### Playoff placeholdery v Pořadí zápasů (v0.7.8)
- Před vygenerováním playoff (před kliknutím "Zahajit playoff") se v Pořadí zápasů zobrazuje **struktura** playoff
- Placeholdery: "1A vs 4B" (multi-tier křížový), "1A vs 2B" (non-multi-tier křížový), "1A vs 2A" (přímý)
- Pásma jsou označená "Pásmo 1 (1.–4.)", "Pásmo 2 (5.–8.)"
- Po kliknutí "Zahajit playoff" placeholder zmizí a reálné zápasy se objeví

### Spustit zápas — kde je tlačítko:
- V tabu **Pořadí zápasů** u každého plánovaného zápasu
- V tabu **Rozlosování** v expandable seznamu zápasů per skupina
- V tabu **Tabulky** (přes `renderZapas` se scoring inputy)
- Klik vyvolá `kurtModal` (jen gamy/body) nebo přímo uloží (cas — kurt z harmonogramu)

---

## 4. Režim kurtů (court mode)

| Režim | Popis | Kdy použít |
|---|---|---|
| **Auto** (default) | První N zápasů na N kurtech, pak fronta — další volný kurt | Většina případů, optimální |
| **1 kurt = 1 skupina** | Každá skupina hraje na svém kurtu po sobě | Když chceme, aby skupina měla svůj kurt |
| **2 kurty = 1 skupina** | Dvojice kurtů hraje jednu skupinu | Kompromis mezi auto a 1=1 |

### Implementační poznámky:
- V Auto módu: queue všechny zápasy, přiřaď pořadí (`poradi_fronta`), kurt se přiřadí dynamicky při startu zápasu
- V 1=1 módu: `skupina` má fixní `kurt` — všechny zápasy té skupiny dostanou ten kurt
- V 2=1 módu: pár kurtů per skupina, queue v rámci dvojice
- Playoff: vždy queue (nezávisle na módu)

---

## 5. Stavy zápasu

| Stav v DB | Popis | UI label |
|---|---|---|
| `ceka` | Nezačal, čeká ve frontě | "Plánovaný" (šedé) |
| `probiha` | Aktuálně hraje (manual "Spustit zápas" nebo auto pro čas) | "Probíhá" (zelené) |
| `ukonceno` | Skóre uložené | Score badge |

### Časová stopa:
- `cas_zacatek` (text, HH:MM) — uloží se při Spustit zápas / auto při startu kola (čas)
- `cas_konec` (text, HH:MM) — uloží se při Uložit skóre / auto při konci kola (čas)
- Není potřeba zobrazovat na UI, jen v scoreboard "v X:XX hodin"

---

## 6. Edit nastavení turnaje (post-vytvoření)

Co lze měnit:
- Název turnaje
- Čas od / do
- Počet kurtů
- Formát zápasu — POZOR: jen pokud žádný zápas nemá výsledek
- Scoring limit — POZOR: aplikuje se jen na nové zápasy
- Playoff yes/no — POZOR: pokud existuje playoff, nelze vypnout (jen smazat playoff)
- Popis, pravidla
- Režim kurtů
- Přidat/odebrat týmy — POZOR: jen pokud nezačala žádná hra

### Validace při změně:
- Pokud změna ohrozí již odehrané zápasy → modal "Toto není možné, již byly odehrány zápasy. Pokud chceš restartovat, zruš a vytvoř nový turnaj."

---

## 7. Smazání turnaje

- **Zrušit** = soft-delete (settings.zruseno = true, stav = ukonceno)
  - Stále viditelný v přehledu s banner "Zrušen"
  - Lze obnovit (settings.zruseno = false)
- **Smazat** = hard-delete z DB
  - Pouze dostupné pro zrušené turnaje
  - Smaže `hry`, kaskádou `turnaj_tymy`, `turnaj_zapasy`, `hra_ucastnici`
  - Vyžaduje potvrzení modalem

---

## 8. Validace skóre

| Formát | Pravidlo |
|---|---|
| Gamy | max(s1, s2) === limit, s1 !== s2 |
| Body | s1 + s2 === limit |
| Čas | s1, s2 ≥ 0, v playoff/multi-tier nesmí být s1 === s2 |

Body s auto-dopočtem: pokud uživatel napíše s1, doplníme s2 = limit - s1.

---

## 9. Veřejný pohled

- URL: `/hry/[id]` viditelné pro každého (RLS na SELECT je public)
- Pokud uživatel není `jeEditor` → schovat editační kontroly, zobrazit jen read-only
- Sdílecí tlačítko: zkopíruje URL do schránky
- QR kód: vygenerovat z URL (budoucnost)

---

## 10. Co je v DB a jak se to používá

### `hry`
- `settings` (jsonb) — uchovává VŠE specifické pro typ hry
  - Pro turnaj: `scoring_typ`, `scoring_limit`, `scoring_limit_playoff`, `odlisny_scoring`, `playoff`, `typ_playoff`, `multi_tier`, `typ_parovani`, `popis`, `pravidla`, `rezim_kurtu`, `zruseno`, `duvod_zruseni`, `zruseno_at`
- `stav` — 'priprava' | 'probiha' | 'ukonceno' (zrušené turnaje = ukonceno + settings.zruseno = true)

### `turnaj_tymy`
- `nazev` (text) — buď "Jmeno1 / Jmeno2" nebo název týmu
- `hrac1_id`, `hrac2_id` (uuid → hra_ucastnici) — null pokud pouzitNazvyTymu

### `turnaj_zapasy`
- `kurt` — null = ještě nepřiřazen / dynamicky se přiřadí
- `poradi_fronta` — pořadí v queue (1, 2, 3...)
- `cas_zacatek`, `cas_konec` — text HH:MM, set při Spustit / Uložit
- `vitez_id` — set při uložení skóre
- `umisteni` — text, pro playoff "1.", "2.", "3.-4." apod.

### RLS policies (manuálně vytvořené 16.5.2026)
- `turnaj_tymy`: SELECT public, INSERT/UPDATE/DELETE jen pro vlastníka nebo editora
- `turnaj_zapasy`: stejně
- `hry`, `hra_ucastnici`, `hra_zapasy`: DELETE policy přidána ve v0.7.4 (předtím chyběla → smazat tiše selhalo)

---

## 11. Roadmapa změn (v0.7.x a dál)

### Playoff módy (v0.7.11+)

`settings.playoff_mode` určuje strukturu playoff:

| Mód | Co se hraje | Počet zápasů (n týmů) |
|---|---|---|
| `bez` | Žádný playoff, pořadí podle skupin | 0 |
| `medaile` | Final Four (top 4 → semis + finále + o3) | 4 (3 pro n=3, 1 pro n=2) |
| `vitez` | Single elimination top {2^k}, bez 3. místa | bracketSize - 1, max 15 |
| `umisteni` | Multi-tier (pásma po 4, každé hraje o své umístění) | dle distribuce do pásem |

**Auto-generování dalších kol v `ulozSkore`:**
- `medaile` / `umisteni`: po dvou semifinále → vygeneruje `kolo=2` (finále s `umisteni="final"` + o 3. místo s `umisteni="o3misto"`)
- `vitez`: po dohrání všech zápasů v kole vygeneruje další kolo s vítězi, posledni kolo `umisteni="final"`

**Generování první vlny v `generujPlayoff`:**
- `bez`: []
- `medaile`: 2 semis (1v4, 2v3) z top 4
- `vitez`: bracketSize/2 zápasů (1vN, 2vN-1,...) z top bracketSize
- `umisteni`: per pásmo 2 semis (1v4, 2v3)

**Migrace ze starých settings:**
- `playoff=false` → `bez`
- `playoff=true & multi_tier=true` → `umisteni`
- `playoff=true & multi_tier=false` → `medaile`

- [x] v0.7.0 — 6-tabová struktura
- [ ] v0.7.1 — Smazat turnaj, auto-výpočet kola pro Čas, validace času pro gamy/body, dokument turnaj-koncept
- [ ] v0.7.2 — Edit nastavení post-vytvoření, režim kurtů
- [ ] v0.7.3 — Implementovat režim kurtů v plánování, auto-stopa času zápasu, live odpočet (čas formát)
- [ ] v0.7.4 — Editor hráčů (sekundární editor přiřazení hráčů k týmům)
- [ ] v0.7.5 — Veřejný pohled (sdílecí URL)
- [ ] v0.8.0 — Export PDF, QR kód, notifikace
