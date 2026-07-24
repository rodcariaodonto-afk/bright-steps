
CREATE TABLE public.kid_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL UNIQUE REFERENCES public.children(id) ON DELETE CASCADE,
  stars integer NOT NULL DEFAULT 0 CHECK (stars >= 0),
  lifetime_stars integer NOT NULL DEFAULT 0 CHECK (lifetime_stars >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kid_rewards TO authenticated;
GRANT ALL ON public.kid_rewards TO service_role;
ALTER TABLE public.kid_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kid_rewards_select" ON public.kid_rewards FOR SELECT TO authenticated
  USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY "kid_rewards_insert" ON public.kid_rewards FOR INSERT TO authenticated
  WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY "kid_rewards_update" ON public.kid_rewards FOR UPDATE TO authenticated
  USING (public.can_write_child(child_id, auth.uid()))
  WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE TRIGGER trg_kid_rewards_updated BEFORE UPDATE ON public.kid_rewards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.kid_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  category text,
  stars_earned integer NOT NULL DEFAULT 0,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, code)
);
CREATE INDEX idx_kid_achievements_child ON public.kid_achievements(child_id, unlocked_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kid_achievements TO authenticated;
GRANT ALL ON public.kid_achievements TO service_role;
ALTER TABLE public.kid_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kid_achievements_select" ON public.kid_achievements FOR SELECT TO authenticated
  USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY "kid_achievements_insert" ON public.kid_achievements FOR INSERT TO authenticated
  WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY "kid_achievements_delete" ON public.kid_achievements FOR DELETE TO authenticated
  USING (public.can_write_child(child_id, auth.uid()));

CREATE TABLE public.kid_reward_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_kid_reward_log_child ON public.kid_reward_log(child_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.kid_reward_log TO authenticated;
GRANT ALL ON public.kid_reward_log TO service_role;
ALTER TABLE public.kid_reward_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kid_reward_log_select" ON public.kid_reward_log FOR SELECT TO authenticated
  USING (public.can_access_child(child_id, auth.uid()));
CREATE POLICY "kid_reward_log_insert" ON public.kid_reward_log FOR INSERT TO authenticated
  WITH CHECK (public.can_write_child(child_id, auth.uid()));

-- Atomic add-stars RPC
CREATE OR REPLACE FUNCTION public.add_kid_stars(_child_id uuid, _delta integer, _reason text, _source text)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE _new integer;
BEGIN
  IF NOT public.can_write_child(_child_id, auth.uid()) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.kid_rewards (child_id, stars, lifetime_stars)
  VALUES (_child_id, GREATEST(0, _delta), GREATEST(0, _delta))
  ON CONFLICT (child_id) DO UPDATE
    SET stars = GREATEST(0, public.kid_rewards.stars + _delta),
        lifetime_stars = public.kid_rewards.lifetime_stars + GREATEST(0, _delta),
        updated_at = now()
  RETURNING stars INTO _new;

  INSERT INTO public.kid_reward_log (child_id, delta, reason, source)
  VALUES (_child_id, _delta, _reason, _source);

  RETURN _new;
END;
$$;
