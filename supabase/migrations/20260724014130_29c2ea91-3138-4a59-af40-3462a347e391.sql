
-- Marketplace fields on professional_profiles
ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS accepting_patients boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visible_in_marketplace boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS modality text,
  ADD COLUMN IF NOT EXISTS price_range text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT ARRAY['pt-BR']::text[];

-- Public listing policy (authenticated users can browse visible + accepting)
DROP POLICY IF EXISTS "Marketplace: authenticated can view visible profiles" ON public.professional_profiles;
CREATE POLICY "Marketplace: authenticated can view visible profiles"
  ON public.professional_profiles
  FOR SELECT
  TO authenticated
  USING (visible_in_marketplace = true);

-- Professional contact requests
CREATE TABLE IF NOT EXISTS public.professional_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_contact_requests TO authenticated;
GRANT ALL ON public.professional_contact_requests TO service_role;

ALTER TABLE public.professional_contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters can view their own contact requests"
  ON public.professional_contact_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_user_id);

CREATE POLICY "Professionals can view contact requests directed to them"
  ON public.professional_contact_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = professional_user_id);

CREATE POLICY "Requesters can create contact requests"
  ON public.professional_contact_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_user_id);

CREATE POLICY "Professionals can update status of requests to them"
  ON public.professional_contact_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = professional_user_id)
  WITH CHECK (auth.uid() = professional_user_id);

CREATE TRIGGER trg_contact_requests_updated_at
  BEFORE UPDATE ON public.professional_contact_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
