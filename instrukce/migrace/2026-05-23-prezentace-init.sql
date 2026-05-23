-- Grand Padel — aplikace pro prezentace pro partnery (KROK 1)
-- Vytváří 3 tabulky + RLS politiky.
-- Admin = profily.role = 'management' (Roman).
--
-- Pusť celé v Supabase SQL editoru (jeden run).

-- =============================================================
-- 1) prezentace — hlavní záznam o vygenerované prezentaci
-- =============================================================
CREATE TABLE public.prezentace (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vytvoril uuid REFERENCES public.profily(id) ON DELETE SET NULL,
  firma_nazev text NOT NULL,
  firma_kontakt_jmeno text,
  firma_kontakt_pozice text,
  firma_kontakt_email text NOT NULL,
  firma_kontakt_telefon text,
  firma_web text,
  typy_spoluprace text[] NOT NULL,
  lokalita text NOT NULL CHECK (lokalita IN ('olomouc','ostrava','praha_zlicin','cela_cr')),
  velikost_firmy text NOT NULL CHECK (velikost_firmy IN ('mala','stredni','velka','korporat')),
  bez_cen boolean NOT NULL DEFAULT false,
  dodatecne_info text,
  generovany_obsah jsonb,
  pdf_url text,
  pptx_url text,
  sdileny_token text UNIQUE,
  poslano_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prezentace_vytvoril ON public.prezentace(vytvoril);
CREATE INDEX idx_prezentace_sdileny_token ON public.prezentace(sdileny_token);
CREATE INDEX idx_prezentace_created_at ON public.prezentace(created_at DESC);

-- =============================================================
-- 2) prezentace_views — tracking zobrazení (veřejný insert)
-- =============================================================
CREATE TABLE public.prezentace_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prezentace_id uuid NOT NULL REFERENCES public.prezentace(id) ON DELETE CASCADE,
  ip text,
  user_agent text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer,
  pages_viewed integer[],
  closed_at timestamptz
);

CREATE INDEX idx_prezentace_views_prezentace_id ON public.prezentace_views(prezentace_id);
CREATE INDEX idx_prezentace_views_opened_at ON public.prezentace_views(opened_at DESC);

-- =============================================================
-- 3) cenove_balicky_sablony — šablony pro generování cen
-- =============================================================
CREATE TABLE public.cenove_balicky_sablony (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  typ_spoluprace text NOT NULL,
  velikost_firmy text NOT NULL CHECK (velikost_firmy IN ('mala','stredni','velka','korporat')),
  nazev text NOT NULL,
  popis text,
  cena_min integer,
  cena_max integer,
  aktivni boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_balicky_typ_velikost
  ON public.cenove_balicky_sablony(typ_spoluprace, velikost_firmy)
  WHERE aktivni;

-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE public.prezentace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prezentace_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cenove_balicky_sablony ENABLE ROW LEVEL SECURITY;

-- Helper: je přihlášený uživatel management?
CREATE OR REPLACE FUNCTION public.je_management()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profily
    WHERE id = auth.uid() AND role = 'management'
  );
$$;

-- prezentace: jen management
CREATE POLICY prezentace_management_all ON public.prezentace
  FOR ALL TO authenticated
  USING (public.je_management())
  WITH CHECK (public.je_management());

-- prezentace_views: anon/auth INSERT povolen (tracking přes sdílený URL)
CREATE POLICY prezentace_views_public_insert ON public.prezentace_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY prezentace_views_management_select ON public.prezentace_views
  FOR SELECT TO authenticated
  USING (public.je_management());

CREATE POLICY prezentace_views_management_update ON public.prezentace_views
  FOR UPDATE TO authenticated
  USING (public.je_management())
  WITH CHECK (public.je_management());

CREATE POLICY prezentace_views_management_delete ON public.prezentace_views
  FOR DELETE TO authenticated
  USING (public.je_management());

-- cenove_balicky_sablony: SELECT všem, write jen management
CREATE POLICY balicky_select_all ON public.cenove_balicky_sablony
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY balicky_management_insert ON public.cenove_balicky_sablony
  FOR INSERT TO authenticated
  WITH CHECK (public.je_management());

CREATE POLICY balicky_management_update ON public.cenove_balicky_sablony
  FOR UPDATE TO authenticated
  USING (public.je_management())
  WITH CHECK (public.je_management());

CREATE POLICY balicky_management_delete ON public.cenove_balicky_sablony
  FOR DELETE TO authenticated
  USING (public.je_management());
