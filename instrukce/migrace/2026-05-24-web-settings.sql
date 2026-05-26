-- Grand Padel — globální nastavení webu (KROK 4 brand 2.0 / theme switch)
-- Jediný řádek (id=1) drží aktivní design ('A' nebo 'B'), který platí pro
-- všechny návštěvníky webu. Historie změn se loguje do web_settings_history.
--
-- Předpoklad: existuje public.profily s sloupcem role a helper je_management()
-- (vytvořen v 2026-05-23-prezentace-init.sql).
--
-- Pusť celé v Supabase SQL editoru (jeden run).

-- =============================================================
-- 1) web_settings — singleton (jen jeden řádek, id = 1)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.web_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  active_design text NOT NULL DEFAULT 'A'
    CHECK (active_design IN ('A', 'B')),
  zmenil uuid REFERENCES public.profily(id) ON DELETE SET NULL,
  zmeneno_at timestamptz NOT NULL DEFAULT now()
);

-- Seed (idempotentní)
INSERT INTO public.web_settings (id, active_design)
VALUES (1, 'A')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 2) web_settings_history — audit log změn
-- =============================================================
CREATE TABLE IF NOT EXISTS public.web_settings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design text NOT NULL CHECK (design IN ('A', 'B')),
  zmenil uuid REFERENCES public.profily(id) ON DELETE SET NULL,
  zmeneno_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_settings_history_zmeneno_at
  ON public.web_settings_history(zmeneno_at DESC);

-- =============================================================
-- 3) Trigger: po UPDATE web_settings zapiš řádek do history
-- =============================================================
CREATE OR REPLACE FUNCTION public.web_settings_log_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.active_design IS DISTINCT FROM OLD.active_design THEN
    INSERT INTO public.web_settings_history (design, zmenil, zmeneno_at)
    VALUES (NEW.active_design, NEW.zmenil, NEW.zmeneno_at);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_web_settings_log_change ON public.web_settings;
CREATE TRIGGER trg_web_settings_log_change
  AFTER UPDATE ON public.web_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.web_settings_log_change();

-- Seed history s počátečním stavem (idempotentní — jen pokud history je prázdná)
INSERT INTO public.web_settings_history (design, zmenil)
SELECT 'A', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.web_settings_history);

-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE public.web_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_settings_history ENABLE ROW LEVEL SECURITY;

-- web_settings:
--   SELECT  — anon + authenticated (potřeba z public webu při SSR)
--   UPDATE  — jen management (přepínač v adminu)
--   INSERT/DELETE — zakázáno (singleton, držíme jen 1 řádek)
DROP POLICY IF EXISTS web_settings_public_select   ON public.web_settings;
DROP POLICY IF EXISTS web_settings_management_update ON public.web_settings;

CREATE POLICY web_settings_public_select ON public.web_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY web_settings_management_update ON public.web_settings
  FOR UPDATE TO authenticated
  USING (public.je_management())
  WITH CHECK (public.je_management());

-- (žádná INSERT ani DELETE policy → operace zablokovány RLS)

-- web_settings_history:
--   SELECT — jen management (audit, ne veřejné)
--   INSERT — jen přes SECURITY DEFINER trigger (žádná policy = blok pro klienty)
DROP POLICY IF EXISTS web_settings_history_management_select ON public.web_settings_history;

CREATE POLICY web_settings_history_management_select ON public.web_settings_history
  FOR SELECT TO authenticated
  USING (public.je_management());
