-- Migrace: RLS DELETE policies pro pomocne tabulky her
-- Datum: 2026-05-17
-- Verze: v0.7.17+
--
-- Proc: smazatHru() v lib/hry.ts mazi i hra_skupiny, hra_skupiny_ucastnici a hra_editatori.
-- Bez techto policies by mazani Mexicana se skupinami nebo hry s editory tise selhalo na RLS.
--
-- Jak spustit: Supabase Dashboard -> SQL Editor -> vlozit a spustit.

CREATE POLICY "hra_editatori_delete" ON public.hra_editatori
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.hry h
      WHERE h.id = hra_editatori.hra_id
        AND (h.created_by = auth.uid()
             OR EXISTS (SELECT 1 FROM public.hra_editatori e
                        WHERE e.hra_id = h.id AND e.user_id = auth.uid()))
    )
  );

CREATE POLICY "hra_skupiny_delete" ON public.hra_skupiny
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.hry h
      WHERE h.id = hra_skupiny.hra_id
        AND (h.created_by = auth.uid()
             OR EXISTS (SELECT 1 FROM public.hra_editatori e
                        WHERE e.hra_id = h.id AND e.user_id = auth.uid()))
    )
  );

CREATE POLICY "hra_skupiny_ucastnici_delete" ON public.hra_skupiny_ucastnici
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.hra_skupiny s
      JOIN public.hry h ON h.id = s.hra_id
      WHERE s.id = hra_skupiny_ucastnici.skupina_id
        AND (h.created_by = auth.uid()
             OR EXISTS (SELECT 1 FROM public.hra_editatori e
                        WHERE e.hra_id = h.id AND e.user_id = auth.uid()))
    )
  );
