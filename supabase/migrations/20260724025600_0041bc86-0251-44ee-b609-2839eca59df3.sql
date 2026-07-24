-- Função que sincroniza user_roles com moderation_status
CREATE OR REPLACE FUNCTION public.tg_sync_professional_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.moderation_status = 'approved' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'professional'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = 'professional'::app_role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_professional_role ON public.professional_profiles;
CREATE TRIGGER trg_sync_professional_role
AFTER INSERT OR UPDATE OF moderation_status ON public.professional_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_professional_role();

-- Backfill: aprovados atuais recebem o papel; demais perdem, caso tenham
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'professional'::app_role
FROM public.professional_profiles
WHERE moderation_status = 'approved'
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles ur
WHERE ur.role = 'professional'::app_role
  AND NOT EXISTS (
    SELECT 1 FROM public.professional_profiles pp
    WHERE pp.user_id = ur.user_id AND pp.moderation_status = 'approved'
  );