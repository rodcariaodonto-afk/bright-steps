
-- ============ calendar_events ============
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  location text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_events_family_start ON public.calendar_events(family_id, starts_at);
CREATE INDEX idx_calendar_events_child ON public.calendar_events(child_id) WHERE child_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members read calendar events"
ON public.calendar_events FOR SELECT TO authenticated
USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Family members create calendar events"
ON public.calendar_events FOR INSERT TO authenticated
WITH CHECK (
  public.is_family_member(family_id, auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Family members update calendar events"
ON public.calendar_events FOR UPDATE TO authenticated
USING (public.is_family_member(family_id, auth.uid()))
WITH CHECK (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Family members delete calendar events"
ON public.calendar_events FOR DELETE TO authenticated
USING (public.is_family_member(family_id, auth.uid()));

CREATE TRIGGER trg_calendar_events_updated
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ============ notifications ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  priority text NOT NULL DEFAULT 'normal',
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE read_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users create their notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);
