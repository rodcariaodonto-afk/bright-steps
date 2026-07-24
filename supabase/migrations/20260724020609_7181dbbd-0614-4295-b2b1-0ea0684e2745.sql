
-- ============ LIBRARY ============
CREATE TABLE public.library_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.library_categories TO anon, authenticated;
GRANT ALL ON public.library_categories TO service_role;
ALTER TABLE public.library_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories readable by all" ON public.library_categories FOR SELECT USING (true);
CREATE POLICY "admin manages categories" ON public.library_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_library_categories_updated BEFORE UPDATE ON public.library_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.library_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.library_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  reading_minutes INT NOT NULL DEFAULT 5,
  author_name TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  audience TEXT NOT NULL DEFAULT 'both' CHECK (audience IN ('family','professional','caregiver','both')),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_library_articles_category ON public.library_articles(category_id);
CREATE INDEX idx_library_articles_published ON public.library_articles(published_at DESC NULLS LAST);
GRANT SELECT ON public.library_articles TO anon, authenticated;
GRANT ALL ON public.library_articles TO service_role;
ALTER TABLE public.library_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published articles are public" ON public.library_articles FOR SELECT
  USING (published_at IS NOT NULL OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manages articles" ON public.library_articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_library_articles_updated BEFORE UPDATE ON public.library_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.library_article_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.library_articles(id) ON DELETE CASCADE,
  saved BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_article_reads TO authenticated;
GRANT ALL ON public.library_article_reads TO service_role;
ALTER TABLE public.library_article_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reads" ON public.library_article_reads FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_library_reads_updated BEFORE UPDATE ON public.library_article_reads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ASSESSMENTS ============
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  audience TEXT NOT NULL DEFAULT 'family' CHECK (audience IN ('family','caregiver','professional')),
  age_min_months INT,
  age_max_months INT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  scoring JSONB NOT NULL DEFAULT '{}'::jsonb,
  disclaimer TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read published assessments" ON public.assessments FOR SELECT TO authenticated
  USING (published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manages assessments" ON public.assessments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_assessments_updated BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  respondent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC,
  band TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assessment_responses_child ON public.assessment_responses(child_id);
CREATE INDEX idx_assessment_responses_respondent ON public.assessment_responses(respondent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_responses TO authenticated;
GRANT ALL ON public.assessment_responses TO service_role;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "respondent reads own" ON public.assessment_responses FOR SELECT TO authenticated
  USING (
    auth.uid() = respondent_id
    OR (child_id IS NOT NULL AND public.can_access_child(child_id, auth.uid()))
  );
CREATE POLICY "respondent inserts own" ON public.assessment_responses FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = respondent_id
    AND (child_id IS NULL OR public.can_write_child(child_id, auth.uid()))
  );
CREATE POLICY "respondent updates own" ON public.assessment_responses FOR UPDATE TO authenticated
  USING (auth.uid() = respondent_id) WITH CHECK (auth.uid() = respondent_id);
CREATE POLICY "respondent deletes own" ON public.assessment_responses FOR DELETE TO authenticated
  USING (auth.uid() = respondent_id);
CREATE TRIGGER trg_assessment_responses_updated BEFORE UPDATE ON public.assessment_responses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CAREGIVER MOOD ============
CREATE TABLE public.caregiver_mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood INT NOT NULL CHECK (mood BETWEEN 1 AND 5),
  stress INT CHECK (stress BETWEEN 1 AND 5),
  sleep_hours NUMERIC(3,1),
  note TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_caregiver_mood_user ON public.caregiver_mood_logs(user_id, logged_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.caregiver_mood_logs TO authenticated;
GRANT ALL ON public.caregiver_mood_logs TO service_role;
ALTER TABLE public.caregiver_mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own caregiver mood" ON public.caregiver_mood_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_caregiver_mood_updated BEFORE UPDATE ON public.caregiver_mood_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEED ============
INSERT INTO public.library_categories (slug, name, description, icon, sort_order) VALUES
  ('alimentacao','Alimentação','Seletividade, texturas e rotinas alimentares.','Utensils',1),
  ('comunicacao','Comunicação funcional','CAA, PECS e estratégias de comunicação.','MessageCircle',2),
  ('comportamento','Manejo de comportamentos','ABC, gatilhos e estratégias de regulação.','Activity',3),
  ('sono','Sono','Higiene do sono e rotinas noturnas.','Moon',4),
  ('autorregulacao','Autorregulação','Estímulos sensoriais e ferramentas de calma.','Waves',5),
  ('escola','Escola inclusiva','Adaptações, PEI e comunicação com a escola.','School',6),
  ('direitos','Direitos e LGPD','Legislação, benefícios e proteção de dados.','Scale',7),
  ('cuidador','Bem-estar do cuidador','Autocuidado, sobrecarga e rede de apoio.','HeartHandshake',8)
ON CONFLICT (slug) DO NOTHING;

-- M-CHAT-R (20 itens simplificados; sim/não; ponto para respostas de risco)
INSERT INTO public.assessments (slug, name, description, audience, age_min_months, age_max_months, questions, scoring, disclaimer) VALUES
('mchat-r','M-CHAT-R (triagem de sinais de TEA)',
 'Questionário educativo de triagem para crianças entre 16 e 30 meses. Não é diagnóstico.',
 'family',16,30,
 '[
   {"id":"q1","text":"Se você aponta algo do outro lado do cômodo, seu filho olha?","risk":"no"},
   {"id":"q2","text":"Você já se perguntou se seu filho é surdo?","risk":"yes"},
   {"id":"q3","text":"Seu filho brinca de faz de conta?","risk":"no"},
   {"id":"q4","text":"Seu filho gosta de subir em coisas?","risk":"no"},
   {"id":"q5","text":"Seu filho faz movimentos incomuns com os dedos perto dos olhos?","risk":"yes"},
   {"id":"q6","text":"Seu filho aponta com o dedo para pedir algo?","risk":"no"},
   {"id":"q7","text":"Seu filho aponta para mostrar algo interessante?","risk":"no"},
   {"id":"q8","text":"Seu filho se interessa por outras crianças?","risk":"no"},
   {"id":"q9","text":"Seu filho mostra objetos trazendo até você?","risk":"no"},
   {"id":"q10","text":"Seu filho responde quando você chama pelo nome?","risk":"no"},
   {"id":"q11","text":"Quando você sorri, ele retribui o sorriso?","risk":"no"},
   {"id":"q12","text":"Seu filho se incomoda com barulhos do dia a dia?","risk":"yes"},
   {"id":"q13","text":"Seu filho anda?","risk":"no"},
   {"id":"q14","text":"Seu filho olha nos seus olhos quando você fala com ele?","risk":"no"},
   {"id":"q15","text":"Seu filho imita o que você faz?","risk":"no"},
   {"id":"q16","text":"Se você vira a cabeça para olhar algo, seu filho olha também?","risk":"no"},
   {"id":"q17","text":"Seu filho tenta chamar sua atenção?","risk":"no"},
   {"id":"q18","text":"Seu filho entende quando você pede algo?","risk":"no"},
   {"id":"q19","text":"Ele olha seu rosto para checar sua reação a algo novo?","risk":"no"},
   {"id":"q20","text":"Seu filho gosta de atividades de movimento?","risk":"no"}
 ]'::jsonb,
 '{"type":"count_risk","bands":[{"max":2,"label":"Baixo risco"},{"max":7,"label":"Risco moderado, converse com pediatra"},{"max":20,"label":"Risco alto, procure avaliação especializada"}]}'::jsonb,
 'Ferramenta educativa. Não substitui avaliação médica ou psicológica.'),

('sono-infantil','Qualidade do sono infantil',
 'Como está o sono da criança nas últimas 2 semanas?',
 'family',null,null,
 '[
   {"id":"s1","text":"Demora mais de 30 min para adormecer","risk":"yes"},
   {"id":"s2","text":"Acorda mais de duas vezes por noite","risk":"yes"},
   {"id":"s3","text":"Ronca ou tem respiração agitada","risk":"yes"},
   {"id":"s4","text":"Acorda irritada ou cansada","risk":"yes"},
   {"id":"s5","text":"Precisa de rotina rígida para dormir","risk":"yes"},
   {"id":"s6","text":"Dorme menos de 9 horas por noite","risk":"yes"}
 ]'::jsonb,
 '{"type":"count_risk","bands":[{"max":1,"label":"Sono adequado"},{"max":3,"label":"Sinais de alerta, revise a rotina noturna"},{"max":6,"label":"Padrão preocupante, considere avaliação"}]}'::jsonb,
 'Ferramenta educativa. Não substitui avaliação clínica.'),

('sobrecarga-cuidador','Sobrecarga do cuidador (Zarit reduzida)',
 'Sinais de sobrecarga emocional e física do cuidador principal.',
 'caregiver',null,null,
 '[
   {"id":"z1","text":"Sente que não tem tempo para si","risk":"yes"},
   {"id":"z2","text":"Sente-se estressado entre cuidar e outras responsabilidades","risk":"yes"},
   {"id":"z3","text":"Sente que sua saúde piorou","risk":"yes"},
   {"id":"z4","text":"Sente-se sobrecarregado","risk":"yes"},
   {"id":"z5","text":"Sente que precisaria de mais ajuda","risk":"yes"},
   {"id":"z6","text":"Sente-se ansioso ou triste com frequência","risk":"yes"}
 ]'::jsonb,
 '{"type":"count_risk","bands":[{"max":1,"label":"Baixa sobrecarga"},{"max":3,"label":"Sobrecarga moderada, cuide de você"},{"max":6,"label":"Sobrecarga alta, procure apoio profissional"}]}'::jsonb,
 'Ferramenta de autocuidado. Não substitui acompanhamento em saúde mental.'),

('marcos-rotina','Marcos da rotina (mensal)',
 'Autoavaliação mensal de rotinas e autonomia.',
 'family',null,null,
 '[
   {"id":"r1","text":"Consegue seguir a rotina matinal sem grandes crises","risk":"no"},
   {"id":"r2","text":"Aceita novos alimentos ou texturas","risk":"no"},
   {"id":"r3","text":"Consegue esperar a vez em atividades","risk":"no"},
   {"id":"r4","text":"Comunica desejos e necessidades","risk":"no"},
   {"id":"r5","text":"Dorme na própria cama","risk":"no"},
   {"id":"r6","text":"Consegue se acalmar sozinho após frustração","risk":"no"}
 ]'::jsonb,
 '{"type":"count_risk","bands":[{"max":1,"label":"Rotina bem estabelecida"},{"max":3,"label":"Boa evolução, continue registrando"},{"max":6,"label":"Muitos desafios ativos, converse com a equipe"}]}'::jsonb,
 'Ferramenta de acompanhamento. Use para conversar com a equipe terapêutica.')
ON CONFLICT (slug) DO NOTHING;
