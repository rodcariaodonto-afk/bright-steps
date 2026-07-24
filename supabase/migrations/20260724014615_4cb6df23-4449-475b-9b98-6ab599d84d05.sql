
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (family_user_id, professional_user_id, child_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = family_user_id OR auth.uid() = professional_user_id);

CREATE POLICY "Participants can create conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = family_user_id OR auth.uid() = professional_user_id);

CREATE POLICY "Participants can update last_message_at"
  ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = family_user_id OR auth.uid() = professional_user_id)
  WITH CHECK (auth.uid() = family_user_id OR auth.uid() = professional_user_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (c.family_user_id = auth.uid() OR c.professional_user_id = auth.uid())
  ));

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.family_user_id = auth.uid() OR c.professional_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can mark counterpart messages as read"
  ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (c.family_user_id = auth.uid() OR c.professional_user_id = auth.uid())
  ))
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_family ON public.conversations(family_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_pro ON public.conversations(professional_user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Trigger to bump last_message_at
CREATE OR REPLACE FUNCTION public.tg_bump_conversation_last_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_bump ON public.messages;
CREATE TRIGGER trg_messages_bump
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_bump_conversation_last_message();
