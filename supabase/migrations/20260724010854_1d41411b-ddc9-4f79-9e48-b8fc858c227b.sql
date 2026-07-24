
CREATE OR REPLACE FUNCTION public.add_professional_by_email(
  _child_id uuid,
  _email text,
  _permission text DEFAULT 'write'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pro_user_id uuid;
  _guardian_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.children c
    JOIN public.families f ON f.id = c.family_id
    WHERE c.id = _child_id AND f.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO _pro_user_id FROM public.profiles WHERE lower(email) = lower(_email);
  IF _pro_user_id IS NULL THEN
    RAISE EXCEPTION 'professional not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.child_guardians (child_id, user_id, permission)
  VALUES (_child_id, _pro_user_id, _permission)
  ON CONFLICT (child_id, user_id) DO UPDATE SET permission = EXCLUDED.permission, revoked_at = NULL
  RETURNING id INTO _guardian_id;

  RETURN _guardian_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_professional_by_email(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_professional_by_email(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_my_patients()
RETURNS TABLE(
  child_id uuid,
  full_name text,
  birth_date date,
  nickname text,
  declared_conditions text[],
  dominant_interest text,
  permission text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.full_name, c.birth_date, c.nickname, c.declared_conditions, c.dominant_interest, cg.permission
  FROM public.child_guardians cg
  JOIN public.children c ON c.id = cg.child_id
  WHERE cg.user_id = auth.uid() AND cg.revoked_at IS NULL AND c.deleted_at IS NULL
  ORDER BY c.full_name;
$$;

REVOKE ALL ON FUNCTION public.list_my_patients() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_patients() TO authenticated;
