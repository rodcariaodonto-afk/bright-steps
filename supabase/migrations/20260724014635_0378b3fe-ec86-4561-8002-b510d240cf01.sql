
DROP POLICY IF EXISTS "Participants can mark counterpart messages as read" ON public.messages;
CREATE POLICY "Participants can mark counterpart messages as read"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.family_user_id = auth.uid() OR c.professional_user_id = auth.uid())
    )
  )
  WITH CHECK (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.family_user_id = auth.uid() OR c.professional_user_id = auth.uid())
    )
  );

REVOKE EXECUTE ON FUNCTION public.tg_bump_conversation_last_message() FROM PUBLIC, anon, authenticated;
