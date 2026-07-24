
CREATE TABLE public.insights_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  insights jsonb NOT NULL DEFAULT '[]'::jsonb,
  range_start timestamptz NOT NULL,
  range_end timestamptz NOT NULL,
  model text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.insights_cache TO authenticated;
GRANT ALL ON public.insights_cache TO service_role;

ALTER TABLE public.insights_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insights readable by authorized users"
  ON public.insights_cache FOR SELECT TO authenticated
  USING (public.can_access_child(child_id, auth.uid()));

CREATE POLICY "Insights insertable by authorized users"
  ON public.insights_cache FOR INSERT TO authenticated
  WITH CHECK (public.can_access_child(child_id, auth.uid()));

CREATE POLICY "Insights updatable by authorized users"
  ON public.insights_cache FOR UPDATE TO authenticated
  USING (public.can_access_child(child_id, auth.uid()))
  WITH CHECK (public.can_access_child(child_id, auth.uid()));

CREATE POLICY "Insights deletable by authorized users"
  ON public.insights_cache FOR DELETE TO authenticated
  USING (public.can_access_child(child_id, auth.uid()));

CREATE INDEX idx_insights_cache_child_created
  ON public.insights_cache (child_id, created_at DESC);

CREATE TRIGGER trg_insights_cache_touch
  BEFORE UPDATE ON public.insights_cache
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
