-- Migrace: SELECT na herni tabulky pro public role (vc. anon)
-- Datum: 2026-05-17
-- Verze: v0.9.2
--
-- Proc: sdileci odkaz na hru (napr. WhatsApp) ma fungovat i pro
-- neprihlaseneho uzivatele. Aktualne hry/hra_ucastnici/hra_zapasy
-- maji SELECT jen pro authenticated -> anon dostane "Hra nenalezena".
-- turnaj_tymy a turnaj_zapasy uz maji public, sjednotime ostatni.
--
-- Jak spustit: Supabase Dashboard -> SQL Editor -> vlozit a spustit.

-- Drop existujici a vytvor s public role
DROP POLICY IF EXISTS "hry_select" ON public.hry;
CREATE POLICY "hry_select" ON public.hry FOR SELECT USING (true);

DROP POLICY IF EXISTS "ucastnici_select" ON public.hra_ucastnici;
CREATE POLICY "ucastnici_select" ON public.hra_ucastnici FOR SELECT USING (true);

DROP POLICY IF EXISTS "zapasy_select" ON public.hra_zapasy;
CREATE POLICY "zapasy_select" ON public.hra_zapasy FOR SELECT USING (true);

-- Editori: jen authenticated (slouzi k zjisteni opravneni)
-- Tady ZACHOVAT authenticated only.
