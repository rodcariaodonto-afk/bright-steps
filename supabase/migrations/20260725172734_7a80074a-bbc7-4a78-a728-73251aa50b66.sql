
-- Registrar novos motores
INSERT INTO public.game_engines (code, name, description, active, default_reward, config_schema) VALUES
('sequence', 'Sequência', 'Ordenar itens numa sequência correta (rotinas, passos, histórias).', true, 5,
 '{"type":"object","required":["order","items"],"properties":{"prompt":{"type":"string"},"order":{"type":"array","items":{"type":"string"}},"items":{"type":"array","items":{"type":"object","required":["id","label"],"properties":{"id":{"type":"string"},"label":{"type":"string"},"emoji":{"type":"string"}}}},"shuffle":{"type":"boolean"}}}'::jsonb),
('categorization', 'Categorização', 'Classificar itens entre múltiplas categorias, um por vez ou em lote.', true, 6,
 '{"type":"object","required":["categories","items"],"properties":{"prompt":{"type":"string"},"oneAtATime":{"type":"boolean"},"categories":{"type":"array","items":{"type":"object","required":["id","label"],"properties":{"id":{"type":"string"},"label":{"type":"string"},"emoji":{"type":"string"}}}},"items":{"type":"array","items":{"type":"object","required":["id","label","correctCategory"],"properties":{"id":{"type":"string"},"label":{"type":"string"},"emoji":{"type":"string"},"correctCategory":{"type":"string"}}}}}}'::jsonb),
('branching_story', 'História Ramificada', 'Histórias interativas com escolhas e finais diferentes.', true, 8,
 '{"type":"object","required":["startId","nodes"],"properties":{"startId":{"type":"string"},"nodes":{"type":"array","items":{"type":"object","required":["id","text"],"properties":{"id":{"type":"string"},"text":{"type":"string"},"emoji":{"type":"string"},"imageUrl":{"type":"string"},"ending":{"type":"boolean"},"choices":{"type":"array","items":{"type":"object","required":["label","next"],"properties":{"label":{"type":"string"},"next":{"type":"string"},"reward":{"type":"number"}}}}}}}}}'::jsonb)
ON CONFLICT (code) DO UPDATE SET active = EXCLUDED.active, config_schema = EXCLUDED.config_schema, description = EXCLUDED.description;

-- Seeds de jogos de exemplo
INSERT INTO public.content_games (slug, title, description, engine_code, config, stars_reward, age_min, age_max, tags, estimated_minutes, difficulty, category, published) VALUES
('sequencia-escovar-dentes', 'Passos para Escovar os Dentes', 'Coloque os passos na ordem certa.', 'sequence',
 '{"prompt":"Como escovamos os dentes?","shuffle":true,
   "items":[
     {"id":"molhar","label":"Molhar a escova","emoji":"💧"},
     {"id":"pasta","label":"Colocar a pasta","emoji":"🧴"},
     {"id":"escovar","label":"Escovar os dentes","emoji":"🪥"},
     {"id":"bochechar","label":"Bochechar com água","emoji":"💦"},
     {"id":"guardar","label":"Guardar a escova","emoji":"🚿"}
   ],
   "order":["molhar","pasta","escovar","bochechar","guardar"]
  }'::jsonb,
 6, 4, 10, ARRAY['rotina','autonomia'], 3, 'easy', 'rotina', true),

('categorizar-frutas-legumes', 'Frutas ou Legumes?', 'Classifique cada alimento na categoria certa.', 'categorization',
 '{"prompt":"Frutas ou legumes?","oneAtATime":true,
   "categories":[
     {"id":"fruta","label":"Frutas","emoji":"🍎"},
     {"id":"legume","label":"Legumes","emoji":"🥕"}
   ],
   "items":[
     {"id":"maca","label":"Maçã","emoji":"🍎","correctCategory":"fruta"},
     {"id":"banana","label":"Banana","emoji":"🍌","correctCategory":"fruta"},
     {"id":"uva","label":"Uva","emoji":"🍇","correctCategory":"fruta"},
     {"id":"morango","label":"Morango","emoji":"🍓","correctCategory":"fruta"},
     {"id":"cenoura","label":"Cenoura","emoji":"🥕","correctCategory":"legume"},
     {"id":"brocolis","label":"Brócolis","emoji":"🥦","correctCategory":"legume"},
     {"id":"milho","label":"Milho","emoji":"🌽","correctCategory":"legume"},
     {"id":"tomate","label":"Tomate","emoji":"🍅","correctCategory":"legume"}
   ]
  }'::jsonb,
 7, 4, 10, ARRAY['alimentacao','classificacao'], 4, 'easy', 'alimentacao', true),

('historia-floresta', 'Aventura na Floresta', 'Ajude o Lu a fazer boas escolhas passeando na floresta.', 'branching_story',
 '{"startId":"inicio",
   "nodes":[
     {"id":"inicio","emoji":"🌳","text":"O Lu chegou à floresta e ouve dois sons: água correndo e um passarinho cantando. Para onde ele vai?",
      "choices":[
        {"label":"Seguir o som da água","next":"riacho","reward":0.5},
        {"label":"Procurar o passarinho","next":"passaro","reward":0.5}
      ]},
     {"id":"riacho","emoji":"💧","text":"O Lu encontra um riacho lindo! Uma pedra escorregadia atravessa até o outro lado.",
      "choices":[
        {"label":"Atravessar com cuidado, olhando bem","next":"outro-lado","reward":1},
        {"label":"Correr rápido","next":"cair","reward":0}
      ]},
     {"id":"passaro","emoji":"🐦","text":"O passarinho leva o Lu até um pé cheio de frutinhas vermelhas.",
      "choices":[
        {"label":"Perguntar antes de pegar","next":"outro-lado","reward":1},
        {"label":"Pegar sem pensar","next":"barriga","reward":0}
      ]},
     {"id":"outro-lado","emoji":"🌈","text":"Muito bem! Lu chegou seguro e feliz numa clareira colorida. Fez uma escolha esperta.","ending":true},
     {"id":"cair","emoji":"💦","text":"Escorregou! Ficou molhado, mas aprendeu que ir devagar é mais seguro.","ending":true},
     {"id":"barriga","emoji":"😖","text":"A frutinha era ácida e a barriga doeu. Da próxima, é bom perguntar antes de comer o que não conhece.","ending":true}
   ]
  }'::jsonb,
 8, 5, 12, ARRAY['historia','decisao','socioemocional'], 5, 'easy', 'historia', true)
ON CONFLICT (slug) DO NOTHING;
