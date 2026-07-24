
REVOKE ALL ON FUNCTION public.add_professional_by_email(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_my_patients() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_professional_by_email(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_patients() TO authenticated;
