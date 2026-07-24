
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.grant_admin_for_founder() from public, anon, authenticated;
-- has_role precisa ser chamável pelo app autenticado (para gates de UI/servidor)
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
