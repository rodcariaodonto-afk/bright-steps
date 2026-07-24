
-- School profiles (schools linked to a child)
CREATE TABLE public.school_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name text NOT NULL,
  teacher_name text,
  teacher_email text,
  grade text,
  class_name text,
  phone text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_school_profiles_child ON public.school_profiles(child_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_profiles TO authenticated;
GRANT ALL ON public.school_profiles TO service_role;
ALTER TABLE public.school_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_profiles_select" ON public.school_profiles FOR SELECT TO authenticated
  USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY "school_profiles_insert" ON public.school_profiles FOR INSERT TO authenticated
  WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY "school_profiles_update" ON public.school_profiles FOR UPDATE TO authenticated
  USING (public.can_write_child(child_id, auth.uid()))
  WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY "school_profiles_delete" ON public.school_profiles FOR DELETE TO authenticated
  USING (public.can_write_child(child_id, auth.uid()));

CREATE TRIGGER trg_school_profiles_updated
  BEFORE UPDATE ON public.school_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- School notes (bidirectional communication)
CREATE TABLE public.school_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.school_profiles(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('family','professional','school')),
  category text NOT NULL CHECK (category IN ('comunicado','comportamento','elogio','ocorrencia','tarefa','reuniao','outro')),
  title text NOT NULL,
  content text NOT NULL,
  mood text,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_school_notes_child_created ON public.school_notes(child_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_notes TO authenticated;
GRANT ALL ON public.school_notes TO service_role;
ALTER TABLE public.school_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_notes_select" ON public.school_notes FOR SELECT TO authenticated
  USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY "school_notes_insert" ON public.school_notes FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND public.can_access_child(child_id, auth.uid())
  );
CREATE POLICY "school_notes_update" ON public.school_notes FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.can_write_child(child_id, auth.uid()))
  WITH CHECK (author_id = auth.uid() OR public.can_write_child(child_id, auth.uid()));
CREATE POLICY "school_notes_delete" ON public.school_notes FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.can_write_child(child_id, auth.uid()));

CREATE TRIGGER trg_school_notes_updated
  BEFORE UPDATE ON public.school_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
