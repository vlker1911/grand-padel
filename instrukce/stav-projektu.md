# Stav projektu Grand Padel

> Tento soubor se automaticky aktualizuje při každé změně v projektu.
> Vždy odráží aktuální stav — co funguje, co chybí, jaká je verze.

---

## Verze

**Aktuální:** v0.15.8  
**Poslední změna:** 23. 5. 2026  
**Git tag:** v0.15.8

### Historie verzí

| Verze | Datum | Co přibylo |
|---|---|---|
| v0.15.8 | 23. 5. 2026 | **Wizard "Doporuč variantu" rozšířen o sety + placement bracket.** Scoring filter má nově **"Na sety (best of 3)"** — generuje variantu s 2 vítěznými sety, do 6 gamů, set TB, STB místo 3. setu (~70 min/zápas). Playoff filter má **"Placement bracket"** — pavouk od začátku (vyžaduje bezSkupin=true). Vzorec: (n/2)·log2(n) zápasů (8t=12, 16t=32, 32t=80, 64t=192). Po zvolení varianty: sety → `setSetyVitezne(2)`; placement → `setPlayoffMode("vitez") + setPlacementBracket(true) + setBezSkupin(true)`. `popisPlayoff` a `popisFormat` rozšířeny o oba nové režimy |
| v0.15.7 | 23. 5. 2026 | **Odebrat tým z turnaje** (jen před losováním). V tabu Hráči přibylo tlačítko **"Odebrat"** vedle "Upravit" — zobrazí se jen pokud `zapasy.length === 0` (turnaj ještě není rozlosovaný). Confirm dialog s názvem týmu. Funkce `odeberTym(tymId, tymNazev)`: DELETE z `turnaj_tymy`. Pokud už proběhlo losování, tlačítko se nezobrazí (a kdyby někdo zavolal funkci jinak, alert blokuje akci) |
| v0.15.6 | 23. 5. 2026 | **Obnovit zrušený turnaj.** V banneru "Turnaj byl zrušen" přibylo tlačítko **"Obnovit turnaj"** (vedle "Smazat trvale"). Funkce `obnovTurnaj()` smaže `settings.zruseno / duvod_zruseni / zruseno_at` a vrátí `stav` na `"priprava"` (pokud žádné zápasy) nebo `"probiha"`. Confirm dialog. Banner zmizí a turnaj se obnoví |
| v0.15.5 | 23. 5. 2026 | **Open Graph + Twitter Card meta tagy.** Sdílení odkazů (WhatsApp, Facebook, LinkedIn, Twitter, iMessage) teď ukáže náhled s logem a fotkou. `layout.tsx` rozšířen: `metadataBase`, `title.template` (`%s | Grand Padel`), description o všech 3 lokalitách (Olomouc/Ostrava/Praha-Zličín), keywords, OG image (`/photos/hero-homepage.jpg` 1200×630), Twitter `summary_large_image`, ikony (monogram). Site URL z env `NEXT_PUBLIC_SITE_URL` (default `https://grandpadel.cz`) |
| v0.15.4 | 23. 5. 2026 | **Middleware → Proxy** (Next.js 16 deprecation). Soubor `src/middleware.ts` přejmenován na `src/proxy.ts`, funkce `middleware()` → `proxy()`. Funkčnost beze změny (Supabase Auth cookies refresh). Build už nehlásí deprecation warning |
| v0.15.3 | 23. 5. 2026 | **Lint errors fix — připraveno pro Vercel build.** 9 chyb v `hry/page.tsx`, `hry/[id]/page.tsx`, `hry/nova/page.tsx` (`react-hooks/set-state-in-effect` + nová React 19 `forward-reference` chyba v useEffect + `next/no-html-link-for-pages`). Fix: `<a href="/hry">` → `<Link>` (import `next/link`), eslint-disable komentáře pro datově načítací useEffecty (správný pattern). `npm run build` ✓ kompletní (14 routes generated) |
| v0.15.2 | 18. 5. 2026 | **Přepočet délky zápasů na body** podle reálné Americano statistiky. Vzorec `limit × 0.5` (předtím `0.45 + 5`). 16 bodů = 8 min, 24 bodů = 12 min, 32 bodů = 16 min. Pro Americano 8 hráčů / 7 zápasů / 32 bodů s 2 min pauzou se vejde do 2 hodin (16×7 + 2×6 = 124 min) |
| v0.15.1 | 18. 5. 2026 | **UI volba pro N mod 4 = 1** (5, 9, 13, 17, 21t — poslední pásmo má 1 tým). Engine: `posledniSamotny: "automaticky" / "slouceni_pasem" / "bonus_zapas"`. UI panel se zobrazí v kroku 4 (doplňková nastavení) jen pro multi-tier a počet týmů kde N mod 4 = 1. Volby: (1) automaticky — nehraje, (2) sloučit poslední 5 týmů do RR, (3) bonus zápas s nejhorším z předchozího pásma |
| v0.15.0 | 18. 5. 2026 | **Sety jako scoring typ** (standardní padel formát). Nový `scoringTyp: "sety"` v `TurnajFormat` + `setyKonfigurace: {vitezne, delkaSetu, setTiebreak, superTiebreak}`. Default: 2 vítězné, do 6 gamů, set tiebreak ZAP, super-tiebreak VYP. Pro 2 vítězné dostupná volba "Super-tiebreak místo 3. setu" (1:1 → STB do 10 bodů). Engine `delkaZapasu`: spočítá realistický čas (best-of-3 ~75 min, s STB ~65 min). UI 4. tlačítko "Sety" v kroku 1 + sub-konfigurace. Validace skóre: ukládá se počet vítězných setů (např. 2:0, 2:1) |
| v0.14.2 | 18. 5. 2026 | **Mini-skupina pro 3-členná pásma** (multi-tier). Místo 1 zápasu o pásmový titul se hraje **round-robin** (3 zápasy: 1v2, 1v3, 2v3) — každý hraje a získá své umístění. Pro 7t: 1.-4. semi+finále + 5.-7. mini-RR. Pro 11t: + 9.-11. mini-RR. Pro 15t: + 13.-15. mini-RR. Pro 23t: + 21.-23. mini-RR. Generická logika `N mod 4 = 3`. Mini-skupiny běží paralelně s hlavními pásmy a skončí dříve než finále čela |
| v0.14.1 | 18. 5. 2026 | **Bug fix postupový klíč — nerovnoměrné skupiny.** Engine generoval zápasy pro neexistující pozice (např. 4.C / 4.D když skupiny C a D mají jen 3 týmy). Fix: před sestavením bracketu se filtrují pozice podle `skupinyMap.get(sk).length` — jen existující se zahrnou. Velikost bracketu se zaokrouhlí dolu na nejbližší mocninu 2. Pro 14t (A=4,B=4,C=3,D=3) / top2+3-4 = 28 zápasů (před 32). Nový test runner `scripts/test-20-scenaru.mjs` (20 edge case scénářů, 20/20 OK). Verify-all 53/53 |
| v0.14.0 | 18. 5. 2026 | **Postupový klíč** (hlavní + útěchový pavouk). Nový typ `PostupovyKlic` v `TurnajFormat`: `hlavniPocetZeSkupiny` (top N do hlavního pavouka) + `utechovy: {od, do}` (volitelný Plate). Engine rozšířen v `vitez` mode: pokud klíč definován, top N×K týmů (kde K=počet skupin) → hlavní bracket, pozice od.-do z každé skupiny → útěchový bracket (single elim). Útěchový pavouk běží **paralelně** s hlavním. UI panel v kroku 3 pod placement bracketem. Test runner 51 scénářů (3 nové: F1=16t/top2+3-4útěch, F2=16t/top1, F3=32t/top2+3-4útěch) |
| v0.13.1 | 18. 5. 2026 | **Seeding chytrý do 64+ týmů.** Funkce `rozdelSeSeedingem` přesunuta z `hry/nova/page.tsx` do `lib/turnaj-postup.ts` (testovatelné). Algoritmus: pot 1 = random permutace (top K do K skupin), pot 2 = cross-pot (opačně k pot 1 — zaručí 1. a (K+1). v různých skupinách), pot 3+ = random permutace. Test `scripts/test-seeding.mjs` ověří 8t/12t/16t/32t/64t s 0 až all-nasazenými týmy — vše OK |
| v0.13.0 | 18. 5. 2026 | **Seeding (nasazené týmy + pot system).** Krok 3 vyplnění párů: vedle "odebrat" nový input "Nasazení" (volitelné, číslo 1, 2, 3, …). Funkce `rozdelSeSeedingem(tymy, K)`: nasazené 1.-K. → pot 1 (1. pozice ve skupinách A-K), K+1..2K → pot 2 (cross-pot: 2. pozice opačně), atd. Ne-nasazené týmy se náhodně rozdělí do zbylých pozic. Pokud žádný tým nemá nasazení, default snake-style distribuce. Cross-pot pravidlo zajistí že 1. a 3. nasazený nemůžou skončit ve stejné skupině. Info nota v UI vysvětluje princip |
| v0.12.0 | 18. 5. 2026 | **Hezké labely fází + lock losování.** Engine generuje `umisteni`: Osmifinále / Čtvrtfinále / Semifinále / Finále podle velikosti bracketu (místo "K1 1.-16. #1"). Pásmo o nižší umístění: "Čtvrtfinále o 9.-16. místo #1". Pro 16t placement: Osmifinále → Čtvrtfinále → Semifinále → Finále + O 3./5.-6./7.-8./9.-10./11.-12./13.-14./15.-16. místo. labelMap regex aktualizován. Lock losování v hry/nova krok 4: po 1. kliknutí se tlačítko změní na "Losovat znovu (vyžaduje potvrzení)" — promt vyžaduje napsat slovo "LOSUJ". Audit: `settings.losovani_provedeno` a `losovani_at` |
| v0.11.2 | 18. 5. 2026 | **Bug fix: zachovat plánovaný čas zápasu.** `ulozSkore` přepisoval `cas_konec` systémovým časem (vznikalo "16:00–08:35"). `spustitZapasNaKurtu` přepisoval `cas_zacatek`. Nyní obojí ponecháno z engine plánu — DB sloupce slouží jako rozvrh, ne skutečný čas. UI test: konečné pořadí v tab Tabulky funguje, taby Rozlosování / Pořadí zápasů renderují korektně |
| v0.11.1 | 18. 5. 2026 | **Fix duplicit po placement.** Stará auto-gen logika v `ulozSkore` (z v0.7.x pro `playoffMode === "vitez"`) generovala další kolo i pro nové turnaje s placement bracketem → duplicitní zápasy. Teď je stará logika aktivní jen pro turnaje bez `settings.turnaj_format` (= před v0.8.0). Nové turnaje řeší výhradně `aktualizujDruhouFazi()`. Plus nový `scripts/verify-all.mjs` — systematická matice 48 smysluplných kombinací, vše prochází |
| v0.11.0 | 18. 5. 2026 | **Plný placement bracket** (až 64 týmů). Nový flag `placementBracket: boolean` v `TurnajFormat`. Algoritmus: po každém kole se bucket rozdělí na vítěze (vyšší pásmo) a poražené (nižší). Každý tým hraje až do konce o své umístění. Počty zápasů: 8t=12, 16t=32, 32t=80, 64t=192. `umisteni` ve formátu `K1 1.-8. #1` → `Vitez K1 1.-8. #1` jako klíč labelMap pro auto-gen. `finalniPoradi` sestaví ranking z `Finale` / `O 3.` / `O 5.-6.` / `O 7.-8.` / atd. UI: checkbox "Hrát o všechna umístění" v kroku 3 pod velikostí pavouka. Test runner 81 scénářů (7 nových placement variant) |
| v0.10.2 | 18. 5. 2026 | **Bug fix konečné pořadí + multi-tier ranking.** `finalniPoradi` hledala `umisteni === "final"` (lowercase), engine od v0.8.0 dává `"Finale"` / `"Finale (1.-4.)"`. Plus pro multi-tier teď zahrnuje **všechna pásma** — vrátí 1.-4., 5.-8., atd. podle finále a o 3. míst |
| v0.10.1 | 18. 5. 2026 | **Bug fix auto-generace:** `useEffect` reagoval jen na změnu počtu zápasů, ne na uložené skóre. Po dohrání semifinále se počet zápasů nezmění (jen update řádku) → finále/o 3. místo se neauto-vygenerovalo. Nový trigger sleduje i `pocetDohranych` (zápasy s nenull skóre) |
| v0.10.0 | 18. 5. 2026 | **Auto-generace 2. fáze v DB.** Nový `lib/turnaj-postup.ts` (V/R/P tabulka skupin, `poradiSkupin()`, `globalniNasazeni()`). V `lib/turnaj-format.ts` přidán `dosadDoRozvrhu()` a `zapasy2Faze()`. V `TurnajView` idempotentní `aktualizujDruhouFazi()`: po dohrání skupin se automaticky vloží 1. kolo playoff (semi / final four / skupiny o umístění), po dohrání semi se doplní finále + o 3. místo s reálnými ID vítězů/poražených. `useEffect` to sleduje a opakovaně volá. Sjednocené labelování nových fází přes `fazeLabelGlobal()` (česky: Semifinále, Finále, O 3. místo, Čtvrtfinále, Útěchový pavouk…) |
| v0.9.7 | 17. 5. 2026 | **Tab Pořadí zápasů fix.** (1) Bug: `spustitZapas` nyní kontroluje, že žádný z týmů nehraje na jiném kurtu — alert + zákaz. (2) Pořadí zápasů je **fixní podle `poradi_fronta`** (z engine) — žádné přesouvání po dohrání. (3) Inline zadání skóre přímo v řádku — pro probíhající a "upravit" se zobrazí inputy, tlačítko "Uložit skóre" |
| v0.9.6 | 17. 5. 2026 | **Finále paralelně s O 3. místo.** Engine přestal čekat se zahájením finále až po dohrání všech ostatních — finále se plánuje hned po svých semi (s pauzou). Příklad: 4 týmy/medaile zkráceno z 2h11min na 1h29min (Finále a O 3. místo hrají paralelně na 2 kurtech, oba končí 17:29). Pro multi-tier s víc pásmy než kurtů: některá pásma matematicky dohrají později — to už je přijatelné. Test validátor "finále poslední" uvolněn |
| v0.9.5 | 17. 5. 2026 | **Star Point = default** (3 shody klasické výhody → Golden Point). Popis opraven, řazení tlačítek (Star / Golden / Klasické výhody) |
| v0.9.4 | 17. 5. 2026 | **Skupiny o umístění — lepší distribuce + Point Rule.** Druhá fáze zachovává velikost první (8t/2×4 → 2×4, 12t/3×4 → 3×4, 16t/4×4 → 4×4). Distribuce přes globální ranking: nasazení 1-V → top, V+1..2V → 2. atd. Méně zápasů ve velkých turnajích. Tiebreak volba schována — auto: do 4/5 gamů → krátký (vítěz na limit), do 6 → klasický. Nová volba **Pravidlo na 40:40**: Golden Point (default, rychlý) / Star Point (+4 min/zápas) / Klasické výhody (+6 min/zápas). Engine zohledňuje v délce zápasu |
| v0.9.3 | 17. 5. 2026 | **Skupiny o umístění + české tiebreak**. Nový playoffMode `skupiny_o_umisteni` — po skupinách druhá fáze ROUND-ROBIN: horní polovina týmů hraje skupinu o 1.-X. místo, dolní o (X+1).-N. (žádný pavouk). Engine + 5 nových test scénářů (74/74). Wizard zahrnuje tuto variantu. Tiebreak v UI přejmenován z "Sudden death" → **"Krátký (1 rozhodující game)"** a "Advantage" → **"Klasický (musíš o 2 gamy)"** s konkrétními příklady stavů |
| v0.9.2 | 17. 5. 2026 | **Sdílecí odkaz funguje bez přihlášení** (vyžaduje migraci `2026-05-17-public-select-her.sql` — SELECT pro public role na `hry`, `hra_ucastnici`, `hra_zapasy`; `turnaj_*` to už měly). **Wizard rozšířen**: výběr "Do kolika gamů" (4/5/6/Je mi to jedno) — viditelný jen pokud způsob počítání zahrnuje gamy. Playoff má 4. volbu "O všechna umístění" (= multi-tier umisteni). localStorage pamatuje i `gamyLimit` |
| v0.9.1 | 17. 5. 2026 | **Startovné UX + sdílení + bug fix IBAN.** Bug fix: `cisloUctuNaIBAN` generoval špatnou kontrolní cifru (CZ→1235, ne 1223). `StartovneTab` regeneruje IBAN při čtení z čísla účtu (tj. staré špatné záznamy se opraví automaticky). Pro Americano/Mexicano top-level tab switcher **"Hra / Startovné"** místo `<details>` (Turnaj má vlastní tab uvnitř). V hlavičce detailu: žlutý chip **"Startovné 500 Kč"** (klik přepne na tab), tlačítko **"Sdílet odkaz"** (Web Share API + clipboard fallback) |
| v0.9.0 | 17. 5. 2026 | **Startovné s QR platbou** (česká SPAYD norma). Sdílená komponenta `components/StartovneTab.tsx`. V turnaji je 7. tab "Startovné", v Americanu/Mexicanu rozbalitelná sekce `<details>`. Organizátor zadá předčíslí / číslo účtu / kód banky / částku / VS / zprávu / poznámku. `lib/qr-platba.ts` validuje číslo účtu (modulo 11) a konvertuje na IBAN, generuje SPAYD string. Knihovna `qrcode.react`. Tlačítko "Stáhnout PNG" exportuje QR jako obrázek |
| v0.8.7 | 17. 5. 2026 | **Kopírovat z předchozího turnaje** — v kroku 1 nové tlačítko "Z předchozího turnaje". Modal načte posledních 20 vlastních turnajů (typ=turnaj, created_by=me) a kliknutím se nastaví celý formulář (kurty, časy, scoring, playoff, útěchový pavouk, bez skupin, vlastní délky). `bez_skupin` se nyní ukládá do `settings` |
| v0.8.6 | 17. 5. 2026 | **Wizard pamatuje poslední nastavení (localStorage)** + nový přepínač **Struktura** (Je mi to jedno / Skupiny + playoff / Jen playoff bez skupin). `generateWizardVariants` iteruje i přes `bezSkupin`, návrh "bez skupin" má v karte hint "· bez skupin" a popis "jen playoff" |
| v0.8.5 | 17. 5. 2026 | **Turnaj bez skupin (jen playoff)**. Engine podporuje `bezSkupin: true` — přeskočí skupinovou fázi, týmy jdou rovnou do playoff podle nasazení (1v4/2v3 u Final Four, 1vN/2v(N-1) u single elim, multi-tier po pásmech). Pro bezSkupin se 1. kolo playoff vkládá do DB s reálnými ID rovnou. Krok 3 wizardu má novou sekci "Skupinová fáze" (Ano / Ne) na začátku. Útěchový pavouk přesunut z kroku 4 do kroku 3 k playoff. Test runner 69 scénářů (8 nových bezSkupin variant) |
| v0.8.4 | 17. 5. 2026 | **Wizard reálnější vstupy.** Místo "Čas od/do" zadává uživatel **délku turnaje (hodiny + minuty)** + quick presety (1.5h / 2h / 3h / 4h / 5h / 6h). Nový vstup **Max kurtů** (default 4) — wizard nenabízí varianty s víc kurty než má klub k dispozici. Nový **Playoff** přepínač (Je mi to jedno / S playoff / Bez playoff). Po výběru se `cas_do` v hlavním formuláři přepočte z `cas_od + délka` (zachovává čas zahájení) |
| v0.8.3 | 17. 5. 2026 | **Wizard "Doporuč variantu" — flexibilnější**. Body odebrány z navrhovaných formátů (turnaje nejsou na body), wizard navrhuje jen **gamy nebo čas**. Přepínač "Způsob počítání" (Je mi to jedno / Na gamy / Na čas). Místo 3 návrhů wizard ukáže **6 variant** (interleaving optimální / max zápasů / s rezervou), tlačítko "Zobrazit další varianty" zpřístupní až 12. U časových variant info "≈ X gamů za zápas" pro představu |
| v0.8.2 | 17. 5. 2026 | **Tab Rozlosování přepsaný na časovou tabulku** — všechny zápasy seřazené podle `poradi_fronta`/`cas_zacatek`. Sloupce: Čas / Kurt / Fáze / Zápas / Stav. Inline zadání skóre, inline změna kurtu přes dropdown (klik na "Kx ⌄"), spuštění zápasu, úprava výsledku. Stejný look jako preview ve wizardu. Funkce `zmenitKurt(zapasId, novyKurt)` v TurnajView |
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
