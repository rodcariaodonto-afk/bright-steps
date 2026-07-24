
-- ============ DOCUMENTS TABLE ============
CREATE TABLE public.child_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  notes TEXT,
  issued_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX child_documents_child_idx ON public.child_documents(child_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_documents TO authenticated;
GRANT ALL ON public.child_documents TO service_role;

ALTER TABLE public.child_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read child documents" ON public.child_documents
  FOR SELECT TO authenticated
  USING (public.can_access_child(child_id, auth.uid()));

CREATE POLICY "write child documents" ON public.child_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_child(child_id, auth.uid()) AND uploaded_by = auth.uid());

CREATE POLICY "update child documents" ON public.child_documents
  FOR UPDATE TO authenticated
  USING (public.can_write_child(child_id, auth.uid()))
  WITH CHECK (public.can_write_child(child_id, auth.uid()));

CREATE POLICY "delete child documents" ON public.child_documents
  FOR DELETE TO authenticated
  USING (public.can_write_child(child_id, auth.uid()));

CREATE TRIGGER child_documents_updated_at
  BEFORE UPDATE ON public.child_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ STORAGE POLICIES for 'documents' bucket ============
-- Path convention: <child_id>/<uuid>-<filename>
CREATE POLICY "documents: read if can access child"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.can_access_child((split_part(name, '/', 1))::uuid, auth.uid())
  );

CREATE POLICY "documents: insert if can write child"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND public.can_write_child((split_part(name, '/', 1))::uuid, auth.uid())
  );

CREATE POLICY "documents: delete if can write child"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.can_write_child((split_part(name, '/', 1))::uuid, auth.uid())
  );
