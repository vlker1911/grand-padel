# Mexicano

## Princip
- **Hráči se přesouvají po kurtech** podle výsledku zápasu
- Hraje se **na čas** (typicky 10-15 min na kolo)
- **Vítězové stoupají** (na vyšší kurt), **poražení klesají**
- Hierarchie kurtů: **Kurt 1 = nejvyšší prestiž**

## Pohyb mezi kurty

| Pozice | Vítězný pár | Poražený pár |
|---|---|---|
| **Kurt 1** (nejvyšší) | Zůstává na Kurt 1 | Klesá na Kurt 2 |
| **Kurt mezilehlý** | Stoupá na vyšší kurt | Klesá na nižší kurt |
| **Kurt N** (nejnižší) | Stoupá na Kurt N-1 | Zůstává na Kurt N |

### Příklad pro 3 kurty po dohrání kola:
```
Před:        Vítězové z:    Poražení z:
Kurt 1: A+B  → stay         → klesnout
Kurt 2: C+D  → stoupnout    → klesnout
Kurt 3: E+F  → stoupnout    → stay

Po:
Kurt 1: A+B (zůstali) + výherci z Kurt 2
Kurt 2: poražení z Kurt 1 + výherci z Kurt 3
Kurt 3: poražení z Kurt 2 + (poražení z Kurt 3 zůstali)
```

## Skórování

### Princip: zápas na čas
- Pevný čas na kolo (např. 12 min)
- Po vypršení času: kdo má víc bodů, vyhrává
- **Bodový systém uvnitř zápasu:** klasický padel (15-30-40-game), počítají se gamy
- Většinou: jen zaškrtnutí "Vítěz: Tým A" nebo "Tým B" — aplikace neukládá konkrétní skóre

### Validace
- V současné aplikaci: výsledek je radio (vítěz tým 1 / vítěz tým 2)
- Není remíza (čas vždy určí jednoho)
- Není maximum skóre

## Tabulka & pořadí

Mexicano má **individuální tabulku** (jako Americano), protože hráči se přesouvají:
- Vítězství = +1 do statistiky hráče
- Pohybuje se po kurtech

Aktuálně app Mexicano nemá detailní tabulku — jen historii kol s vítězi.

> **TODO:** doplnit Mexicano tabulku s body za vítězství, případně bonus za umístění na vyšším kurtu

## Časové plánování

```
celkemMinut = casDo - casOd
pocetKol = floor(celkemMinut / (minutNaKolo + minutPresunu))
```

Doporučená délka:
- **10 min/kolo + 3 min přesun** = 13 min cyklus → 6 kol za 78 min
- **12 min/kolo + 3 min přesun** = 15 min cyklus → 6 kol za 90 min
- **15 min/kolo + 5 min přesun** = 20 min cyklus → 6 kol za 120 min

## Počet hráčů a kurtů

- Minimum: **4 hráči** (1 kurt)
- Klasická Mexicana: **8-12 hráčů** (2-3 kurty)
- Velká Mexicana: **16-20 hráčů** (4-5 kurtů)

## Trvání

Mexicano je vždy **na čas** (na rozdíl od Americana, které dohrává až do konce všech zápasů).

Lze nastavit pevný čas (např. 2h):
- Aplikace spočítá max kol
- Po dosažení času: Mexicano končí, pořadí podle dosažených vítězství
