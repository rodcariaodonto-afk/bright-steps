
-- ========= GOALS =========
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  target_value NUMERIC,
  unit TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select" ON public.goals FOR SELECT TO authenticated
  USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY "goals_insert" ON public.goals FOR INSERT TO authenticated
  WITH CHECK (public.can_write_child(child_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "goals_update" ON public.goals FOR UPDATE TO authenticated
  USING (public.can_write_child(child_id, auth.uid()))
  WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY "goals_delete" ON public.goals FOR DELETE TO authenticated
  USING (public.can_write_child(child_id, auth.uid()));

CREATE TRIGGER goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX goals_child_status_idx ON public.goals(child_id, status);

-- ========= GOAL PROGRESS =========
CREATE TABLE public.goal_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES auth.users(id),
  value NUMERIC,
  note TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_progress TO authenticated;
GRANT ALL ON public.goal_progress TO service_role;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_progress_select" ON public.goal_progress FOR SELECT TO authenticated
  USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY "goal_progress_insert" ON public.goal_progress FOR INSERT TO authenticated
  WITH CHECK (public.can_write_child(child_id, auth.uid()) AND logged_by = auth.uid());
CREATE POLICY "goal_progress_delete" ON public.goal_progress FOR DELETE TO authenticated
  USING (public.can_write_child(child_id, auth.uid()));

CREATE INDEX goal_progress_goal_idx ON public.goal_progress(goal_id, logged_at DESC);

-- ========= REPORTS =========
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  kind TEXT NOT NULL DEFAULT 'weekly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select" ON public.reports FOR SELECT TO authenticated
  USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY "reports_insert" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (public.can_write_child(child_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "reports_update" ON public.reports FOR UPDATE TO authenticated
  USING (public.can_write_child(child_id, auth.uid()))
  WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY "reports_delete" ON public.reports FOR DELETE TO authenticated
  USING (public.can_write_child(child_id, auth.uid()));

CREATE TRIGGER reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX reports_child_period_idx ON public.reports(child_id, period_end DESC);
