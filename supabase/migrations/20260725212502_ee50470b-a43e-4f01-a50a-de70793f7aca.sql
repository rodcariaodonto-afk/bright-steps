
CREATE TABLE public.content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('story','game')),
  entity_id uuid NOT NULL,
  locale text NOT NULL,
  source_locale text NOT NULL DEFAULT 'pt-BR',
  source_hash text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'auto' CHECK (status IN ('auto','reviewed','manual')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, locale)
);

CREATE INDEX idx_content_translations_lookup
  ON public.content_translations (entity_type, entity_id, locale);

GRANT SELECT ON public.content_translations TO authenticated;
GRANT ALL ON public.content_translations TO service_role;

ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_can_read_translations"
  ON public.content_translations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admins_can_manage_translations"
  ON public.content_translations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_content_translations_touch
  BEFORE UPDATE ON public.content_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
