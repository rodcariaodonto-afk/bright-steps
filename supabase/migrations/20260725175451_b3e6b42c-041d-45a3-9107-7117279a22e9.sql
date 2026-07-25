CREATE TABLE IF NOT EXISTS public.ai_persona_settings (
  persona_id text PRIMARY KEY,
  display_name text NOT NULL,
  model text NOT NULL,
  extra_instructions text DEFAULT '',
  temperature numeric(3,2) DEFAULT 0.7,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.ai_persona_settings TO authenticated;
GRANT ALL ON public.ai_persona_settings TO service_role;

ALTER TABLE public.ai_persona_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read persona settings"
  ON public.ai_persona_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage persona settings"
  ON public.ai_persona_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.ai_persona_settings (persona_id, display_name, model, extra_instructions)
VALUES
  ('family',   'Azul Família',  'google/gemini-3.5-flash', ''),
  ('clinical', 'Azul Clínico',  'google/gemini-3.5-flash', ''),
  ('child',    'Azul Amigo',    'google/gemini-3.5-flash', ''),
  ('school',   'Azul Escola',   'google/gemini-3.5-flash', ''),
  ('admin',    'Azul Admin',    'google/gemini-3.5-flash', '')
ON CONFLICT (persona_id) DO NOTHING;