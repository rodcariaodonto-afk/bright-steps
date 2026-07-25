
-- ============================================================
-- 1. FEATURE FLAGS
-- ============================================================
CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_read_authenticated" ON public.feature_flags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "feature_flags_admin_write" ON public.feature_flags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('ai_family', true, 'Assistente de IA para famílias'),
  ('ai_pro', true, 'Assistente de IA clínica para profissionais'),
  ('ai_child', true, 'Personagem Azul (chat lúdico) para crianças'),
  ('marketplace', true, 'Marketplace público de profissionais'),
  ('community', true, 'Comunidade de famílias'),
  ('messaging', true, 'Mensagens em tempo real família/profissional'),
  ('library', true, 'Biblioteca de artigos'),
  ('assessments', true, 'Autoavaliações (M-CHAT-R e outros)'),
  ('signups_open', true, 'Permitir novos cadastros públicos'),
  ('kid_module', true, 'Módulo lúdico para crianças'),
  ('school_module', true, 'Módulo escolar')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 2. APP SETTINGS
-- ============================================================
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_read_authenticated" ON public.app_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "app_settings_admin_write" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.app_settings (key, value, description) VALUES
  ('app_name', '"Meu Mundo Azul"'::jsonb, 'Nome do aplicativo exibido em e-mails e headers'),
  ('support_email', '"suporte@meumundoazul.app"'::jsonb, 'E-mail de suporte exibido aos usuários'),
  ('terms_url', '""'::jsonb, 'URL dos Termos de Uso'),
  ('privacy_url', '""'::jsonb, 'URL da Política de Privacidade'),
  ('default_trial_days', '7'::jsonb, 'Dias de trial gratuito ao assinar'),
  ('max_children_per_family', '10'::jsonb, 'Máximo de crianças por família'),
  ('max_professionals_per_child', '20'::jsonb, 'Máximo de profissionais vinculados por criança')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 3. ADMIN AUDIT LOG
-- ============================================================
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_audit_log_admin_read" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);
CREATE INDEX idx_admin_audit_log_actor ON public.admin_audit_log (actor_id, created_at DESC);

-- ============================================================
-- 4. COMPLIMENTARY SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.complimentary_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL,
  granted_by uuid NOT NULL,
  reason text,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.complimentary_subscriptions TO authenticated;
GRANT ALL ON public.complimentary_subscriptions TO service_role;

ALTER TABLE public.complimentary_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comp_sub_owner_read" ON public.complimentary_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "comp_sub_admin_write" ON public.complimentary_subscriptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_comp_sub_user_active ON public.complimentary_subscriptions (user_id)
  WHERE revoked_at IS NULL;

-- ============================================================
-- 5. UPDATE SUBSCRIPTION HELPERS TO INCLUDE COMPLIMENTARY
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'sandbox'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
      and environment = check_env
      and (
        (status in ('active','trialing') and (current_period_end is null or current_period_end > now()))
        or (status = 'canceled' and current_period_end > now())
      )
  ) or exists (
    select 1 from public.complimentary_subscriptions
    where user_id = user_uuid
      and revoked_at is null
      and (expires_at is null or expires_at > now())
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_active_plan(user_uuid uuid, check_env text DEFAULT 'sandbox'::text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (
      select plan from public.complimentary_subscriptions
      where user_id = user_uuid
        and revoked_at is null
        and (expires_at is null or expires_at > now())
      order by created_at desc
      limit 1
    ),
    (
      select product_id from public.subscriptions
      where user_id = user_uuid
        and environment = check_env
        and (
          (status in ('active','trialing') and (current_period_end is null or current_period_end > now()))
          or (status = 'canceled' and current_period_end > now())
        )
      order by created_at desc
      limit 1
    )
  );
$function$;

-- ============================================================
-- 6. PROMOTE caria@axhub.com.br TO ADMIN AUTOMATICALLY
-- ============================================================
CREATE OR REPLACE FUNCTION public.grant_admin_for_founder()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.email_confirmed_at is not null
     and lower(new.email) in ('rodcaria.odonto@gmail.com', 'caria@axhub.com.br') then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$function$;

-- Backfill if caria@axhub.com.br already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE lower(email) = 'caria@axhub.com.br'
  AND email_confirmed_at IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;
