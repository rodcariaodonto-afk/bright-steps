
-- ============ PROFESSIONAL PROFILES ============
CREATE TABLE public.professional_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  council_id text,
  specialties text[] NOT NULL DEFAULT '{}',
  bio text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_profiles TO authenticated;
GRANT ALL ON public.professional_profiles TO service_role;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own professional profile" ON public.professional_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "guardians can view linked professionals" ON public.professional_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.child_guardians cg
      WHERE cg.user_id = professional_profiles.user_id
        AND cg.revoked_at IS NULL
        AND EXISTS (
          SELECT 1 FROM public.child_guardians myg
          WHERE myg.child_id = cg.child_id
            AND myg.user_id = auth.uid()
            AND myg.revoked_at IS NULL
        )
    )
  );

CREATE TRIGGER trg_pp_updated BEFORE UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','done','canceled','no_show')),
  modality text NOT NULL DEFAULT 'in_person' CHECK (modality IN ('in_person','online','home_visit','school_visit')),
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_pro_time ON public.appointments (professional_id, starts_at);
CREATE INDEX idx_appointments_child_time ON public.appointments (child_id, starts_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professional manages own appointments" ON public.appointments
  FOR ALL USING (auth.uid() = professional_id) WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "guardians can view child appointments" ON public.appointments
  FOR SELECT USING (public.can_access_child(child_id, auth.uid()));

CREATE TRIGGER trg_appt_updated BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CLINICAL SESSIONS ============
CREATE TABLE public.clinical_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date timestamptz NOT NULL DEFAULT now(),
  duration_minutes int NOT NULL DEFAULT 50 CHECK (duration_minutes > 0),
  goals_worked text[] NOT NULL DEFAULT '{}',
  activities text,
  materials text,
  child_response text,
  observations text,
  next_steps text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  shared_with_family boolean NOT NULL DEFAULT false,
  shared_with_school boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_child_date ON public.clinical_sessions (child_id, session_date DESC);
CREATE INDEX idx_sessions_pro_date ON public.clinical_sessions (professional_id, session_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_sessions TO authenticated;
GRANT ALL ON public.clinical_sessions TO service_role;
ALTER TABLE public.clinical_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professional manages own sessions" ON public.clinical_sessions
  FOR ALL USING (auth.uid() = professional_id) WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "guardians view shared sessions" ON public.clinical_sessions
  FOR SELECT USING (
    shared_with_family = true
    AND public.can_access_child(child_id, auth.uid())
  );

CREATE TRIGGER trg_csess_updated BEFORE UPDATE ON public.clinical_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ EVOLUTION ENTRIES ============
CREATE TABLE public.evolution_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  category text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  shared_with_family boolean NOT NULL DEFAULT true,
  shared_with_school boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_evolution_child_date ON public.evolution_entries (child_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evolution_entries TO authenticated;
GRANT ALL ON public.evolution_entries TO service_role;
ALTER TABLE public.evolution_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professional manages own evolution" ON public.evolution_entries
  FOR ALL USING (auth.uid() = professional_id) WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "guardians view shared evolution" ON public.evolution_entries
  FOR SELECT USING (
    shared_with_family = true
    AND public.can_access_child(child_id, auth.uid())
  );

CREATE TRIGGER trg_evo_updated BEFORE UPDATE ON public.evolution_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
