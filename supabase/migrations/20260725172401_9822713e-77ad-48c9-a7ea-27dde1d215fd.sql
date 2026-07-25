
-- Ativar motores + atualizar schemas
UPDATE public.game_engines SET active = true, config_schema = '{
  "type":"object",
  "required":["questions"],
  "properties":{
    "questions":{"type":"array","items":{
      "type":"object","required":["prompt","options","correctIndex"],
      "properties":{"prompt":{"type":"string"},"options":{"type":"array","items":{"type":"string"}},"correctIndex":{"type":"integer"},"explanation":{"type":"string"}}
    }},
    "shuffleOptions":{"type":"boolean"},
    "showExplanation":{"type":"boolean"}
  }
}'::jsonb WHERE code = 'quiz';

UPDATE public.game_engines SET active = true, config_schema = '{
  "type":"object","required":["pairs"],
  "properties":{
    "pairs":{"type":"array","items":{
      "type":"object","required":["id"],
      "properties":{"id":{"type":"string"},"label":{"type":"string"},"emoji":{"type":"string"}}
    }},
    "gridSize":{"type":"string","enum":["2x2","2x3","3x4","4x4","4x5"]},
    "timeLimitSec":{"type":"integer"}
  }
}'::jsonb WHERE code = 'memory';

UPDATE public.game_engines SET active = true, config_schema = '{
  "type":"object","required":["buckets","items"],
  "properties":{
    "prompt":{"type":"string"},
    "buckets":{"type":"array","items":{"type":"object","required":["id","label"],"properties":{"id":{"type":"string"},"label":{"type":"string"},"emoji":{"type":"string"}}}},
    "items":{"type":"array","items":{"type":"object","required":["id","label","correctBucket"],"properties":{"id":{"type":"string"},"label":{"type":"string"},"emoji":{"type":"string"},"correctBucket":{"type":"string"}}}}
  }
}'::jsonb WHERE code = 'drag_drop';

-- Seeds de jogos de exemplo
INSERT INTO public.content_games (slug, title, description, engine_code, config, stars_reward, age_min, age_max, tags, estimated_minutes, difficulty, category, published)
VALUES
('quiz-emocoes', 'Quiz das Emoções', 'Reconheça a emoção certa em cada situação.', 'quiz',
 '{"shuffleOptions":true,"showExplanation":true,"questions":[
   {"prompt":"Ana ganhou um presente. Como ela está?","options":["Alegre","Triste","Com medo"],"correctIndex":0,"explanation":"Ganhar presentes costuma trazer alegria."},
   {"prompt":"O bichinho de estimação do João sumiu. Como ele se sente?","options":["Feliz","Triste","Bravo"],"correctIndex":1},
   {"prompt":"Um trovão bem alto assustou a Bia. Ela está:","options":["Com medo","Curiosa","Cansada"],"correctIndex":0},
   {"prompt":"O irmão pegou o brinquedo sem pedir. Você pode ficar:","options":["Alegre","Bravo","Sonolento"],"correctIndex":1},
   {"prompt":"Fez um desenho lindo. Você se sente:","options":["Orgulhoso","Triste","Com fome"],"correctIndex":0}
 ]}'::jsonb,
 5, 4, 10, ARRAY['emocoes','socioemocional'], 4, 'easy', 'socioemocional', true),

('memoria-animais', 'Memória dos Animais', 'Encontre os pares de animais.', 'memory',
 '{"gridSize":"3x4","timeLimitSec":120,"pairs":[
   {"id":"gato","label":"Gato","emoji":"🐱"},
   {"id":"cachorro","label":"Cachorro","emoji":"🐶"},
   {"id":"leao","label":"Leão","emoji":"🦁"},
   {"id":"panda","label":"Panda","emoji":"🐼"},
   {"id":"coelho","label":"Coelho","emoji":"🐰"},
   {"id":"raposa","label":"Raposa","emoji":"🦊"}
 ]}'::jsonb,
 8, 4, 10, ARRAY['memoria','animais'], 5, 'easy', 'memoria', true),

('classificar-habitat', 'Onde eles moram?', 'Arraste cada animal para o habitat correto.', 'drag_drop',
 '{"prompt":"Cada animal mora em um lugar. Onde vai cada um?","buckets":[
    {"id":"agua","label":"Água","emoji":"🌊"},
    {"id":"terra","label":"Terra","emoji":"🌳"},
    {"id":"ar","label":"Ar","emoji":"☁️"}
   ],
   "items":[
    {"id":"peixe","label":"Peixe","emoji":"🐟","correctBucket":"agua"},
    {"id":"golfinho","label":"Golfinho","emoji":"🐬","correctBucket":"agua"},
    {"id":"leao","label":"Leão","emoji":"🦁","correctBucket":"terra"},
    {"id":"elefante","label":"Elefante","emoji":"🐘","correctBucket":"terra"},
    {"id":"passaro","label":"Pássaro","emoji":"🐦","correctBucket":"ar"},
    {"id":"aguia","label":"Águia","emoji":"🦅","correctBucket":"ar"}
   ]
  }'::jsonb,
 6, 4, 10, ARRAY['classificacao','ciencias'], 4, 'easy', 'ciencias', true)
ON CONFLICT (slug) DO NOTHING;
