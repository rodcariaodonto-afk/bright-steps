
-- Trigger utilitário para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================================
-- 1. FAMILIES
-- =========================================================================
CREATE TABLE public.families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.families TO authenticated;
GRANT ALL ON public.families TO service_role;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_families_owner ON public.families(owner_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 2. FAMILY_MEMBERS
-- =========================================================================
CREATE TYPE public.family_role AS ENUM ('owner', 'guardian', 'parent', 'caregiver');
CREATE TYPE public.member_status AS ENUM ('active', 'invited', 'revoked');

CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email text,
  role family_role NOT NULL DEFAULT 'guardian',
  status member_status NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_member_identity CHECK (user_id IS NOT NULL OR invited_email IS NOT NULL)
);

CREATE UNIQUE INDEX uq_family_members_user ON public.family_members(family_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_family_members_email ON public.family_members(family_id, lower(invited_email)) WHERE invited_email IS NOT NULL;
CREATE INDEX idx_family_members_user ON public.family_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: membro ativo da família
CREATE OR REPLACE FUNCTION public.is_family_member(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = _family_id
      AND user_id = _user_id
      AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.families
    WHERE id = _family_id AND owner_id = _user_id AND deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_family_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_family_member(uuid, uuid) TO authenticated, service_role;

-- Políticas FAMILIES
CREATE POLICY "families_select_members" ON public.families
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      owner_id = auth.uid()
      OR public.is_family_member(id, auth.uid())
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "families_insert_own" ON public.families
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "families_update_owner" ON public.families
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "families_delete_owner" ON public.families
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Políticas FAMILY_MEMBERS
CREATE POLICY "family_members_select" ON public.family_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_family_member(family_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "family_members_insert_owner" ON public.family_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.families WHERE id = family_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "family_members_update_owner" ON public.family_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = family_id AND owner_id = auth.uid())
    OR user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.families WHERE id = family_id AND owner_id = auth.uid())
    OR user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "family_members_delete_owner" ON public.family_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = family_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================================================
-- 3. CHILDREN
-- =========================================================================
CREATE TYPE public.child_pronouns AS ENUM ('ele', 'ela', 'elu', 'outro');

CREATE TABLE public.children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  nickname text,
  birth_date date,
  pronouns child_pronouns,
  avatar_url text,
  declared_conditions text[] NOT NULL DEFAULT '{}',
  dominant_interest text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_children_family ON public.children(family_id) WHERE deleted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO authenticated;
GRANT ALL ON public.children TO service_role;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 4. CHILD_GUARDIANS
-- =========================================================================
CREATE TYPE public.guardian_permission AS ENUM ('read', 'write', 'admin');

CREATE TABLE public.child_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission guardian_permission NOT NULL DEFAULT 'write',
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (child_id, user_id)
);

CREATE INDEX idx_child_guardians_user ON public.child_guardians(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_child_guardians_child ON public.child_guardians(child_id) WHERE revoked_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_guardians TO authenticated;
GRANT ALL ON public.child_guardians TO service_role;
ALTER TABLE public.child_guardians ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_child(_child_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.child_guardians cg
    WHERE cg.child_id = _child_id
      AND cg.user_id = _user_id
      AND cg.revoked_at IS NULL
  ) OR EXISTS (
    SELECT 1
    FROM public.children c
    JOIN public.families f ON f.id = c.family_id
    WHERE c.id = _child_id
      AND c.deleted_at IS NULL
      AND (f.owner_id = _user_id OR public.is_family_member(f.id, _user_id))
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_child(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_child(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_write_child(_child_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.child_guardians cg
    WHERE cg.child_id = _child_id
      AND cg.user_id = _user_id
      AND cg.revoked_at IS NULL
      AND cg.permission IN ('write', 'admin')
  ) OR EXISTS (
    SELECT 1
    FROM public.children c
    JOIN public.families f ON f.id = c.family_id
    WHERE c.id = _child_id
      AND c.deleted_at IS NULL
      AND (f.owner_id = _user_id OR EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.family_id = f.id AND fm.user_id = _user_id
          AND fm.status = 'active'
          AND fm.role IN ('owner', 'guardian', 'parent')
      ))
  );
$$;

REVOKE ALL ON FUNCTION public.can_write_child(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_write_child(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "children_select" ON public.children
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      public.can_access_child(id, auth.uid())
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "children_insert" ON public.children
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = family_id
        AND (f.owner_id = auth.uid() OR public.is_family_member(f.id, auth.uid()))
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "children_update" ON public.children
  FOR UPDATE TO authenticated
  USING (public.can_write_child(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.can_write_child(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "children_delete" ON public.children
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = family_id AND f.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "child_guardians_select" ON public.child_guardians
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.can_access_child(child_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "child_guardians_insert" ON public.child_guardians
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.families f ON f.id = c.family_id
      WHERE c.id = child_id AND f.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "child_guardians_update" ON public.child_guardians
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.families f ON f.id = c.family_id
      WHERE c.id = child_id AND f.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.families f ON f.id = c.family_id
      WHERE c.id = child_id AND f.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "child_guardians_delete" ON public.child_guardians
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.families f ON f.id = c.family_id
      WHERE c.id = child_id AND f.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================================================
-- 5. CONSENT_RECORDS
-- =========================================================================
CREATE TYPE public.consent_scope AS ENUM (
  'ai_context',
  'ai_memory',
  'clinical_share',
  'school_share',
  'marketplace_personalization',
  'community_visibility',
  'analytics',
  'marketing'
);

CREATE TABLE public.consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_child_id uuid REFERENCES public.children(id) ON DELETE CASCADE,
  scope consent_scope NOT NULL,
  purpose text NOT NULL,
  granted boolean NOT NULL,
  version int NOT NULL DEFAULT 1,
  granted_by uuid NOT NULL REFERENCES auth.users(id),
  evidence jsonb,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT consent_has_subject CHECK (subject_user_id IS NOT NULL OR subject_child_id IS NOT NULL)
);

CREATE INDEX idx_consent_child ON public.consent_records(subject_child_id, scope) WHERE revoked_at IS NULL;
CREATE INDEX idx_consent_user ON public.consent_records(subject_user_id, scope) WHERE revoked_at IS NULL;

GRANT SELECT, INSERT, UPDATE ON public.consent_records TO authenticated;
GRANT ALL ON public.consent_records TO service_role;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consent_select" ON public.consent_records
  FOR SELECT TO authenticated
  USING (
    subject_user_id = auth.uid()
    OR granted_by = auth.uid()
    OR (subject_child_id IS NOT NULL AND public.can_access_child(subject_child_id, auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "consent_insert" ON public.consent_records
  FOR INSERT TO authenticated
  WITH CHECK (
    granted_by = auth.uid() AND (
      subject_user_id = auth.uid()
      OR (subject_child_id IS NOT NULL AND public.can_write_child(subject_child_id, auth.uid()))
    )
  );

CREATE POLICY "consent_update_revoke" ON public.consent_records
  FOR UPDATE TO authenticated
  USING (granted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (granted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- 6. STORAGE POLICIES
-- =========================================================================
-- avatars: cada usuário só na sua pasta userId/...
CREATE POLICY "avatars_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_write_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- children: pasta = childId
CREATE POLICY "children_media_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'children'
    AND public.can_access_child(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "children_media_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'children'
    AND public.can_write_child(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "children_media_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'children'
    AND public.can_write_child(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "children_media_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'children'
    AND public.can_write_child(((storage.foldername(name))[1])::uuid, auth.uid())
  );
