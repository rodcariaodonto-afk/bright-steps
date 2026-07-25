
-- ============= NEW CONTENT SEED =============
INSERT INTO public.content_games
  (slug, title, description, category, difficulty, engine_code, config, stars_reward, age_min, age_max, tags, estimated_minutes, accessibility, published)
VALUES
-- 1. Reconhecendo Emoções (quiz)
('emocoes-reconhecer','Como ela está se sentindo?','Aprenda a reconhecer emoções pelo rosto.','socioemocional','easy','quiz',
 jsonb_build_object('shuffleOptions',true,'showExplanation',true,'questions',
   jsonb_build_array(
     jsonb_build_object('prompt','😊 Como ela está?','options',jsonb_build_array('Feliz','Triste','Bravo','Assustado'),'correctIndex',0,'explanation','Rosto sorrindo indica alegria.'),
     jsonb_build_object('prompt','😢 E agora?','options',jsonb_build_array('Feliz','Triste','Surpreso','Calmo'),'correctIndex',1,'explanation','Lágrimas mostram tristeza.'),
     jsonb_build_object('prompt','😠 E este rosto?','options',jsonb_build_array('Feliz','Bravo','Triste','Confuso'),'correctIndex',1,'explanation','Sobrancelha franzida indica raiva.'),
     jsonb_build_object('prompt','😨 O que ele sente?','options',jsonb_build_array('Medo','Alegria','Calma','Amor'),'correctIndex',0,'explanation','Olhos arregalados mostram medo.'),
     jsonb_build_object('prompt','😴 E este?','options',jsonb_build_array('Bravo','Cansado','Feliz','Bravo'),'correctIndex',1,'explanation','Bocejo indica cansaço.')
   )),
 5,3,10,ARRAY['emocoes','socioemocional'],5,
 jsonb_build_object('hasAudio',false,'hasCaptions',true,'highContrast',false,'reducedMotion',false),true),

-- 2. Cores básicas (quiz)
('cores-basicas','Que cor é essa?','Descubra as cores do mundo.','cognitiva','easy','quiz',
 jsonb_build_object('shuffleOptions',true,'questions',
   jsonb_build_array(
     jsonb_build_object('prompt','🍎 Qual a cor da maçã?','options',jsonb_build_array('Vermelho','Azul','Verde','Amarelo'),'correctIndex',0),
     jsonb_build_object('prompt','🍌 Qual a cor da banana?','options',jsonb_build_array('Roxo','Amarelo','Preto','Azul'),'correctIndex',1),
     jsonb_build_object('prompt','🌊 Qual a cor do mar?','options',jsonb_build_array('Azul','Rosa','Marrom','Branco'),'correctIndex',0),
     jsonb_build_object('prompt','🌱 Qual a cor da planta?','options',jsonb_build_array('Vermelho','Verde','Preto','Cinza'),'correctIndex',1),
     jsonb_build_object('prompt','☀️ Qual a cor do sol?','options',jsonb_build_array('Amarelo','Roxo','Verde','Azul'),'correctIndex',0)
   )),
 5,3,8,ARRAY['cores','cognitiva'],4,
 jsonb_build_object('hasAudio',false,'hasCaptions',true,'highContrast',true,'reducedMotion',false),true),

-- 3. Números (quiz)
('numeros-contar','Vamos contar!','Aprenda a contar até 10.','cognitiva','easy','quiz',
 jsonb_build_object('questions',
   jsonb_build_array(
     jsonb_build_object('prompt','🍎🍎 Quantas maçãs?','options',jsonb_build_array('1','2','3','4'),'correctIndex',1),
     jsonb_build_object('prompt','⭐⭐⭐ Quantas estrelas?','options',jsonb_build_array('2','3','4','5'),'correctIndex',1),
     jsonb_build_object('prompt','🐶🐶🐶🐶 Quantos cachorros?','options',jsonb_build_array('3','4','5','6'),'correctIndex',1),
     jsonb_build_object('prompt','🎈🎈🎈🎈🎈 Quantos balões?','options',jsonb_build_array('4','5','6','7'),'correctIndex',1),
     jsonb_build_object('prompt','🍪 Quantos biscoitos?','options',jsonb_build_array('1','2','3','0'),'correctIndex',0)
   )),
 5,4,8,ARRAY['numeros','cognitiva'],4,
 jsonb_build_object('hasCaptions',true),true),

-- 4. Letras (quiz)
('letras-inicial','Que letra começa?','Descubra a primeira letra.','cognitiva','medium','quiz',
 jsonb_build_object('questions',
   jsonb_build_array(
     jsonb_build_object('prompt','🍎 Com que letra começa MAÇÃ?','options',jsonb_build_array('B','M','A','P'),'correctIndex',1),
     jsonb_build_object('prompt','🐶 Com que letra começa CACHORRO?','options',jsonb_build_array('C','K','G','D'),'correctIndex',0),
     jsonb_build_object('prompt','🌞 Com que letra começa SOL?','options',jsonb_build_array('C','S','Z','L'),'correctIndex',1),
     jsonb_build_object('prompt','🏠 Com que letra começa CASA?','options',jsonb_build_array('K','C','Q','S'),'correctIndex',1),
     jsonb_build_object('prompt','🐟 Com que letra começa PEIXE?','options',jsonb_build_array('B','V','P','F'),'correctIndex',2)
   )),
 6,5,9,ARRAY['letras','alfabetizacao'],5,
 jsonb_build_object('hasCaptions',true),true),

-- 5. Memória das Cores
('memoria-cores','Memória das Cores','Encontre pares das mesmas cores.','memoria','easy','memory',
 jsonb_build_object('gridSize','3x4','pairs',
   jsonb_build_array(
     jsonb_build_object('id','r','label','Vermelho','emoji','🟥'),
     jsonb_build_object('id','a','label','Azul','emoji','🟦'),
     jsonb_build_object('id','v','label','Verde','emoji','🟩'),
     jsonb_build_object('id','y','label','Amarelo','emoji','🟨'),
     jsonb_build_object('id','p','label','Roxo','emoji','🟪'),
     jsonb_build_object('id','o','label','Laranja','emoji','🟧')
   )),
 6,3,10,ARRAY['memoria','cores'],5,
 jsonb_build_object('reducedMotion',true),true),

-- 6. Memória Frutas
('memoria-frutas','Memória das Frutas','Ache os pares de frutas.','memoria','easy','memory',
 jsonb_build_object('gridSize','3x4','pairs',
   jsonb_build_array(
     jsonb_build_object('id','ap','label','Maçã','emoji','🍎'),
     jsonb_build_object('id','ba','label','Banana','emoji','🍌'),
     jsonb_build_object('id','gr','label','Uva','emoji','🍇'),
     jsonb_build_object('id','wa','label','Melancia','emoji','🍉'),
     jsonb_build_object('id','st','label','Morango','emoji','🍓'),
     jsonb_build_object('id','pi','label','Abacaxi','emoji','🍍')
   )),
 6,3,10,ARRAY['memoria','frutas','alimentacao'],5,
 jsonb_build_object('reducedMotion',true),true),

-- 7. Higiene: sequência do banho
('higiene-sequencia-banho','Hora do Banho!','Coloque na ordem certa os passos do banho.','rotina','medium','sequence',
 jsonb_build_object('prompt','Como é o banho?','shuffle',true,
   'items',jsonb_build_array(
     jsonb_build_object('id','tirar','label','Tirar a roupa','emoji','👕'),
     jsonb_build_object('id','ligar','label','Ligar o chuveiro','emoji','🚿'),
     jsonb_build_object('id','sabao','label','Passar sabonete','emoji','🧼'),
     jsonb_build_object('id','enxaguar','label','Enxaguar','emoji','💧'),
     jsonb_build_object('id','desligar','label','Desligar chuveiro','emoji','🛑'),
     jsonb_build_object('id','secar','label','Secar com toalha','emoji','🧺')
   ),
   'order',jsonb_build_array('tirar','ligar','sabao','enxaguar','desligar','secar')),
 7,4,10,ARRAY['higiene','rotina'],6,
 jsonb_build_object('hasCaptions',true),true),

-- 8. Família: quem é quem (drag_drop)
('familia-quem-e','Quem é da minha família?','Coloque cada pessoa no grupo certo.','socioemocional','easy','drag_drop',
 jsonb_build_object('prompt','Arraste cada pessoa para o grupo certo.',
   'buckets',jsonb_build_array(
     jsonb_build_object('id','fam','label','Família','emoji','👨‍👩‍👧'),
     jsonb_build_object('id','out','label','Outras pessoas','emoji','🧑‍🤝‍🧑')
   ),
   'items',jsonb_build_array(
     jsonb_build_object('id','mae','label','Mamãe','emoji','👩','correctBucket','fam'),
     jsonb_build_object('id','pai','label','Papai','emoji','👨','correctBucket','fam'),
     jsonb_build_object('id','irm','label','Irmão','emoji','🧒','correctBucket','fam'),
     jsonb_build_object('id','vov','label','Vovó','emoji','👵','correctBucket','fam'),
     jsonb_build_object('id','pro','label','Professora','emoji','👩‍🏫','correctBucket','out'),
     jsonb_build_object('id','vzn','label','Vizinho','emoji','🧑','correctBucket','out'),
     jsonb_build_object('id','med','label','Médico','emoji','👨‍⚕️','correctBucket','out')
   )),
 6,3,9,ARRAY['familia','socioemocional'],5,
 jsonb_build_object('hasCaptions',true),true),

-- 9. Objetos da cozinha (categorization)
('objetos-cozinha','Onde fica cada objeto?','Coloque os objetos no cômodo certo da casa.','cognitiva','medium','categorization',
 jsonb_build_object('prompt','Em qual cômodo usamos cada objeto?','oneAtATime',false,
   'categories',jsonb_build_array(
     jsonb_build_object('id','cozinha','label','Cozinha','emoji','🍽️'),
     jsonb_build_object('id','banheiro','label','Banheiro','emoji','🛁'),
     jsonb_build_object('id','quarto','label','Quarto','emoji','🛏️')
   ),
   'items',jsonb_build_array(
     jsonb_build_object('id','panela','label','Panela','emoji','🍳','correctCategory','cozinha'),
     jsonb_build_object('id','geladeira','label','Geladeira','emoji','🧊','correctCategory','cozinha'),
     jsonb_build_object('id','escova','label','Escova de dentes','emoji','🪥','correctCategory','banheiro'),
     jsonb_build_object('id','shampoo','label','Shampoo','emoji','🧴','correctCategory','banheiro'),
     jsonb_build_object('id','cama','label','Cama','emoji','🛌','correctCategory','quarto'),
     jsonb_build_object('id','travesseiro','label','Travesseiro','emoji','🛏️','correctCategory','quarto')
   )),
 7,4,10,ARRAY['objetos','casa','cognitiva'],6,
 jsonb_build_object('hasCaptions',true),true),

-- 10. Alimentação saudável (categorization)
('alimentacao-saudavel','Comida saudável?','Separe os alimentos saudáveis dos doces.','alimentacao','easy','categorization',
 jsonb_build_object('prompt','O que é mais saudável para comer todo dia?','oneAtATime',false,
   'categories',jsonb_build_array(
     jsonb_build_object('id','sau','label','Saudável','emoji','🥗'),
     jsonb_build_object('id','doc','label','Só às vezes','emoji','🍭')
   ),
   'items',jsonb_build_array(
     jsonb_build_object('id','maca','label','Maçã','emoji','🍎','correctCategory','sau'),
     jsonb_build_object('id','brocolis','label','Brócolis','emoji','🥦','correctCategory','sau'),
     jsonb_build_object('id','ovo','label','Ovo','emoji','🥚','correctCategory','sau'),
     jsonb_build_object('id','arroz','label','Arroz','emoji','🍚','correctCategory','sau'),
     jsonb_build_object('id','bolo','label','Bolo','emoji','🍰','correctCategory','doc'),
     jsonb_build_object('id','pirulito','label','Pirulito','emoji','🍭','correctCategory','doc'),
     jsonb_build_object('id','refri','label','Refrigerante','emoji','🥤','correctCategory','doc')
   )),
 6,3,10,ARRAY['alimentacao','saude'],5,
 jsonb_build_object('hasCaptions',true),true)

ON CONFLICT (slug) DO NOTHING;

-- ============= RANKING INFANTIL (anonimizado) =============
CREATE OR REPLACE FUNCTION public.top_kids_leaderboard(limit_n integer DEFAULT 20)
RETURNS TABLE(display_name text, stars integer, lifetime_stars integer, rank bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(c.nickname,''), LEFT(c.full_name,1)||'.') AS display_name,
    kr.stars,
    kr.lifetime_stars,
    ROW_NUMBER() OVER (ORDER BY kr.lifetime_stars DESC, kr.updated_at DESC) AS rank
  FROM public.kid_rewards kr
  JOIN public.children c ON c.id = kr.child_id
  WHERE c.deleted_at IS NULL AND kr.lifetime_stars > 0
  ORDER BY kr.lifetime_stars DESC, kr.updated_at DESC
  LIMIT limit_n;
$$;

GRANT EXECUTE ON FUNCTION public.top_kids_leaderboard(integer) TO authenticated;
