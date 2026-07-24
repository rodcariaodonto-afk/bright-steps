
-- ============ Onda O: Marketplace 2.0 ============

-- 1) Extensões (para unaccent no slug)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2) Colunas novas em professional_profiles
ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS council_type text,
  ADD COLUMN IF NOT EXISTS council_number text,
  ADD COLUMN IF NOT EXISTS council_state text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid,
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','featured','premium')),
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count integer NOT NULL DEFAULT 0;

-- 3) Função de slugify
CREATE OR REPLACE FUNCTION public.slugify_text(input text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(
    regexp_replace(lower(unaccent(coalesce(input,''))), '[^a-z0-9]+', '-', 'g'),
    '(^-+|-+$)', '', 'g'
  );
$$;

-- 4) Trigger para gerar/garantir slug único
CREATE OR REPLACE FUNCTION public.tg_professional_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base text;
  candidate text;
  n int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := public.slugify_text(NEW.full_name);
    IF base = '' THEN base := 'profissional'; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.professional_profiles WHERE slug = candidate AND id <> NEW.id) LOOP
      n := n + 1;
      candidate := base || '-' || n::text;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_professional_slug ON public.professional_profiles;
CREATE TRIGGER trg_professional_slug
  BEFORE INSERT OR UPDATE OF full_name, slug ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_professional_slug();

-- Preencher slugs existentes
UPDATE public.professional_profiles
   SET slug = NULL
 WHERE slug IS NULL;
UPDATE public.professional_profiles SET full_name = full_name WHERE slug IS NULL;

-- 5) Recalcular moderação para pending quando profissional edita dados críticos
CREATE OR REPLACE FUNCTION public.tg_professional_reset_moderation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.full_name IS DISTINCT FROM OLD.full_name OR
    NEW.council_number IS DISTINCT FROM OLD.council_number OR
    NEW.council_type IS DISTINCT FROM OLD.council_type OR
    NEW.bio IS DISTINCT FROM OLD.bio
  ) AND OLD.moderation_status = 'approved' THEN
    NEW.moderation_status := 'pending';
    NEW.moderated_at := NULL;
    NEW.moderated_by := NULL;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_professional_reset_moderation ON public.professional_profiles;
CREATE TRIGGER trg_professional_reset_moderation
  BEFORE UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_professional_reset_moderation();

-- 6) RLS: substituir política de leitura pública do marketplace por versão que exige aprovação
DROP POLICY IF EXISTS "Public can view visible professionals" ON public.professional_profiles;
DROP POLICY IF EXISTS "Anyone can view marketplace professionals" ON public.professional_profiles;
DROP POLICY IF EXISTS "Marketplace approved visible" ON public.professional_profiles;

CREATE POLICY "Marketplace approved visible"
  ON public.professional_profiles
  FOR SELECT
  TO anon, authenticated
  USING (visible_in_marketplace = true AND moderation_status = 'approved');

-- Admin pode ver e atualizar tudo
DROP POLICY IF EXISTS "Admins manage professionals" ON public.professional_profiles;
CREATE POLICY "Admins manage professionals"
  ON public.professional_profiles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.professional_profiles TO anon;

-- 7) Tabela de avaliações
CREATE TABLE IF NOT EXISTS public.professional_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_user_id uuid NOT NULL,
  author_user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden','flagged')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_user_id, author_user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_reviews TO authenticated;
GRANT SELECT ON public.professional_reviews TO anon;
GRANT ALL ON public.professional_reviews TO service_role;

ALTER TABLE public.professional_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public if published"
  ON public.professional_reviews FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Authors manage own reviews"
  ON public.professional_reviews FOR ALL
  TO authenticated
  USING (auth.uid() = author_user_id)
  WITH CHECK (auth.uid() = author_user_id);

CREATE POLICY "Admins manage all reviews"
  ON public.professional_reviews FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.professional_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8) Trigger para recalcular média/contagem
CREATE OR REPLACE FUNCTION public.tg_recalc_professional_rating()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  _uid uuid;
  _avg numeric(3,2);
  _cnt int;
BEGIN
  _uid := COALESCE(NEW.professional_user_id, OLD.professional_user_id);
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0), COUNT(*)
    INTO _avg, _cnt
    FROM public.professional_reviews
   WHERE professional_user_id = _uid AND status = 'published';
  UPDATE public.professional_profiles
     SET average_rating = _avg, reviews_count = _cnt
   WHERE user_id = _uid;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_recalc_professional_rating ON public.professional_reviews;
CREATE TRIGGER trg_recalc_professional_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.professional_reviews
  FOR EACH ROW EXECUTE FUNCTION public.tg_recalc_professional_rating();

-- 9) Aprovar automaticamente perfis já existentes visíveis (retro-compat)
UPDATE public.professional_profiles
   SET moderation_status = 'approved',
       moderated_at = now()
 WHERE visible_in_marketplace = true
   AND moderation_status = 'pending';
