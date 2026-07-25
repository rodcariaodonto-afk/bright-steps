
-- 1. game_engines
CREATE TABLE public.game_engines (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  config_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_reward integer NOT NULL DEFAULT 5,
  active boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.game_engines TO authenticated;
GRANT ALL ON public.game_engines TO service_role;
ALTER TABLE public.game_engines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engines_read_auth" ON public.game_engines FOR SELECT TO authenticated USING (true);
CREATE POLICY "engines_admin_write" ON public.game_engines FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_game_engines_updated BEFORE UPDATE ON public.game_engines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Extend content_games
ALTER TABLE public.content_games
  ADD COLUMN IF NOT EXISTS engine_code text REFERENCES public.game_engines(code) ON UPDATE CASCADE,
  ADD COLUMN IF NOT EXISTS age_min integer,
  ADD COLUMN IF NOT EXISTS age_max integer,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS estimated_minutes integer,
  ADD COLUMN IF NOT EXISTS accessibility jsonb NOT NULL DEFAULT '{"hasAudio":false,"hasCaptions":false,"highContrast":false,"reducedMotion":false}'::jsonb;

-- 3. game_sessions
CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.content_games(id) ON DELETE CASCADE,
  engine_code text NOT NULL REFERENCES public.game_engines(code),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_ms integer,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
  score integer,
  max_score integer,
  stars_awarded integer NOT NULL DEFAULT 0,
  difficulty text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_game_sessions_child ON public.game_sessions(child_id, started_at DESC);
CREATE INDEX idx_game_sessions_game ON public.game_sessions(game_id);
GRANT SELECT, INSERT, UPDATE ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_read_guardian" ON public.game_sessions FOR SELECT TO authenticated
  USING (public.can_access_child(child_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "sessions_write_guardian" ON public.game_sessions FOR INSERT TO authenticated
  WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE POLICY "sessions_update_guardian" ON public.game_sessions FOR UPDATE TO authenticated
  USING (public.can_write_child(child_id, auth.uid())) WITH CHECK (public.can_write_child(child_id, auth.uid()));
CREATE TRIGGER trg_game_sessions_updated BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. game_events
CREATE TABLE public.game_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  elapsed_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_game_events_session ON public.game_events(session_id, created_at);
GRANT SELECT, INSERT ON public.game_events TO authenticated;
GRANT ALL ON public.game_events TO service_role;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_read_guardian" ON public.game_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id
    AND (public.can_access_child(s.child_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "events_insert_guardian" ON public.game_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id
    AND public.can_write_child(s.child_id, auth.uid())));

-- 5. RPCs
CREATE OR REPLACE FUNCTION public.start_game_session(_child_id uuid, _game_id uuid, _difficulty text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _engine text; _session uuid;
BEGIN
  IF NOT public.can_write_child(_child_id, auth.uid()) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  SELECT engine_code INTO _engine FROM public.content_games WHERE id = _game_id AND published = true;
  IF _engine IS NULL THEN
    RAISE EXCEPTION 'game not found or unpublished' USING ERRCODE = 'P0002';
  END IF;
  INSERT INTO public.game_sessions (child_id, game_id, engine_code, difficulty, created_by)
  VALUES (_child_id, _game_id, _engine, _difficulty, auth.uid())
  RETURNING id INTO _session;
  RETURN _session;
END; $$;

CREATE OR REPLACE FUNCTION public.complete_game_session(
  _session_id uuid, _score integer, _max_score integer, _status text DEFAULT 'completed', _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _child uuid; _game uuid; _reward integer; _stars integer := 0; _started timestamptz;
BEGIN
  SELECT child_id, game_id, started_at INTO _child, _game, _started
  FROM public.game_sessions WHERE id = _session_id;
  IF _child IS NULL THEN
    RAISE EXCEPTION 'session not found' USING ERRCODE = 'P0002';
  END IF;
  IF NOT public.can_write_child(_child, auth.uid()) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  IF _status NOT IN ('completed','abandoned') THEN
    RAISE EXCEPTION 'invalid status' USING ERRCODE = '22023';
  END IF;
  IF _status = 'completed' THEN
    SELECT COALESCE(stars_reward, 5) INTO _reward FROM public.content_games WHERE id = _game;
    IF _max_score > 0 THEN
      _stars := GREATEST(1, ROUND(_reward * (_score::numeric / _max_score)));
    ELSE
      _stars := _reward;
    END IF;
    PERFORM public.add_kid_stars(_child, _stars, 'Jogo concluído', 'game:' || _session_id::text);
  END IF;
  UPDATE public.game_sessions
     SET ended_at = now(),
         duration_ms = EXTRACT(EPOCH FROM (now() - _started))::integer * 1000,
         status = _status,
         score = _score,
         max_score = _max_score,
         stars_awarded = _stars,
         metadata = _metadata
   WHERE id = _session_id;
  RETURN _stars;
END; $$;

REVOKE ALL ON FUNCTION public.start_game_session(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_game_session(uuid, integer, integer, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_game_session(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_game_session(uuid, integer, integer, text, jsonb) TO authenticated;

-- 6. Seed motores
INSERT INTO public.game_engines (code, name, description, icon, default_reward, active, config_schema) VALUES
  ('quiz', 'Quiz', 'Perguntas de múltipla escolha, verdadeiro/falso, com suporte a imagem e áudio.', 'help-circle', 5, false,
   '{"type":"object","required":["questions"],"properties":{"questions":{"type":"array","items":{"type":"object","required":["prompt","options","answer"],"properties":{"prompt":{"type":"string"},"imageUrl":{"type":"string"},"audioUrl":{"type":"string"},"options":{"type":"array","items":{"type":"string"},"minItems":2},"answer":{"type":"integer"},"explanation":{"type":"string"}}}}}}'::jsonb),
  ('memory', 'Memória', 'Jogo da memória com cartas de imagens e/ou sons.', 'brain', 5, false,
   '{"type":"object","required":["cards"],"properties":{"cards":{"type":"array","items":{"type":"object","required":["id","imageUrl"],"properties":{"id":{"type":"string"},"imageUrl":{"type":"string"},"audioUrl":{"type":"string"},"label":{"type":"string"}}}},"pairs":{"type":"integer"}}}'::jsonb),
  ('drag_drop', 'Arrastar e soltar', 'Combine itens à sua categoria correta.', 'move', 5, false,
   '{"type":"object","required":["buckets","items"],"properties":{"buckets":{"type":"array","items":{"type":"object","required":["id","label"],"properties":{"id":{"type":"string"},"label":{"type":"string"},"imageUrl":{"type":"string"}}}},"items":{"type":"array","items":{"type":"object","required":["id","bucketId"],"properties":{"id":{"type":"string"},"label":{"type":"string"},"imageUrl":{"type":"string"},"bucketId":{"type":"string"}}}}}}'::jsonb),
  ('echo', 'Echo (teste)', 'Motor interno para validação do pipeline. Não listar em produção.', 'zap', 1, true,
   '{"type":"object","properties":{"message":{"type":"string"}}}'::jsonb)
ON CONFLICT (code) DO NOTHING;
