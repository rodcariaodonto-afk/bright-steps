
-- Wave B: Rotina de vida

-- ROTINAS
CREATE TABLE public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'daily',
  time_of_day TIME,
  days_of_week SMALLINT[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6]::SMALLINT[],
  icon TEXT, color TEXT, notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX routines_child_active_idx ON public.routines(child_id, is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routines TO authenticated;
GRANT ALL ON public.routines TO service_role;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY routines_select ON public.routines FOR SELECT TO authenticated USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY routines_insert ON public.routines FOR INSERT TO authenticated WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY routines_update ON public.routines FOR UPDATE TO authenticated USING (public.can_write_child(child_id, auth.uid())) WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY routines_delete ON public.routines FOR DELETE TO authenticated USING (public.can_write_child(child_id, auth.uid()));

CREATE TABLE public.routine_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  completed_on DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'done',
  note TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (routine_id, completed_on)
);
CREATE INDEX rc_child_date_idx ON public.routine_completions(child_id, completed_on DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routine_completions TO authenticated;
GRANT ALL ON public.routine_completions TO service_role;
ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rc_select ON public.routine_completions FOR SELECT TO authenticated USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY rc_insert ON public.routine_completions FOR INSERT TO authenticated WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY rc_update ON public.routine_completions FOR UPDATE TO authenticated USING (public.can_write_child(child_id, auth.uid())) WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY rc_delete ON public.routine_completions FOR DELETE TO authenticated USING (public.can_write_child(child_id, auth.uid()));

-- MEDICAÇÃO
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT, route TEXT, frequency TEXT,
  schedule_times TIME[] NOT NULL DEFAULT ARRAY[]::TIME[],
  start_date DATE, end_date DATE,
  prescriber TEXT, notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX meds_child_active_idx ON public.medications(child_id, is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT ALL ON public.medications TO service_role;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY meds_select ON public.medications FOR SELECT TO authenticated USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY meds_insert ON public.medications FOR INSERT TO authenticated WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY meds_update ON public.medications FOR UPDATE TO authenticated USING (public.can_write_child(child_id, auth.uid())) WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY meds_delete ON public.medications FOR DELETE TO authenticated USING (public.can_write_child(child_id, auth.uid()));

CREATE TABLE public.medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'taken',
  dose_taken TEXT, side_effects TEXT, note TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX medlogs_child_date_idx ON public.medication_logs(child_id, taken_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medication_logs TO authenticated;
GRANT ALL ON public.medication_logs TO service_role;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY ml_select ON public.medication_logs FOR SELECT TO authenticated USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY ml_insert ON public.medication_logs FOR INSERT TO authenticated WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY ml_update ON public.medication_logs FOR UPDATE TO authenticated USING (public.can_write_child(child_id, auth.uid())) WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY ml_delete ON public.medication_logs FOR DELETE TO authenticated USING (public.can_write_child(child_id, auth.uid()));

-- HUMOR
CREATE TABLE public.mood_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  level SMALLINT NOT NULL,
  emoji TEXT,
  triggers TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  note TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mood_level_range CHECK (level BETWEEN 1 AND 5)
);
CREATE INDEX mood_child_date_idx ON public.mood_logs(child_id, logged_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_logs TO authenticated;
GRANT ALL ON public.mood_logs TO service_role;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY mood_select ON public.mood_logs FOR SELECT TO authenticated USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY mood_insert ON public.mood_logs FOR INSERT TO authenticated WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY mood_update ON public.mood_logs FOR UPDATE TO authenticated USING (public.can_write_child(child_id, auth.uid())) WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY mood_delete ON public.mood_logs FOR DELETE TO authenticated USING (public.can_write_child(child_id, auth.uid()));

-- COMPORTAMENTO
CREATE TABLE public.behavior_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category TEXT NOT NULL DEFAULT 'other',
  intensity SMALLINT,
  duration_minutes INT,
  antecedent TEXT, behavior TEXT, consequence TEXT,
  location TEXT,
  triggers TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  strategies_used TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  note TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT beh_intensity_range CHECK (intensity IS NULL OR intensity BETWEEN 1 AND 5)
);
CREATE INDEX beh_child_date_idx ON public.behavior_events(child_id, occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavior_events TO authenticated;
GRANT ALL ON public.behavior_events TO service_role;
ALTER TABLE public.behavior_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY beh_select ON public.behavior_events FOR SELECT TO authenticated USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY beh_insert ON public.behavior_events FOR INSERT TO authenticated WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY beh_update ON public.behavior_events FOR UPDATE TO authenticated USING (public.can_write_child(child_id, auth.uid())) WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY beh_delete ON public.behavior_events FOR DELETE TO authenticated USING (public.can_write_child(child_id, auth.uid()));

-- Trigger de updated_at compartilhado
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER routines_touch BEFORE UPDATE ON public.routines FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER medications_touch BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
