-- Promove usuários existentes
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) IN ('rodcaria.odonto@gmail.com', 'caria@axhub.com.br')
ON CONFLICT (user_id, role) DO NOTHING;

-- Atualiza trigger para incluir ambos e-mails
CREATE OR REPLACE FUNCTION public.promote_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) IN ('caria@axhub.com.br', 'rodcaria.odonto@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;