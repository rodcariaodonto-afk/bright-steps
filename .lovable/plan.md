## Sprint 2 — Três motores de jogo JSON-driven

Implementar os três primeiros motores reais em cima da infra da Sprint 1. Cada motor recebe `config` (JSON), reporta eventos via `onEvent` e chama `onComplete({ score, maxScore, status, metadata })`. Todos ganham estrelinhas via o pipeline já existente (`complete_game_session` → `add_kid_stars`).

### 1. Motor Quiz (`src/modules/games/engines/quiz.tsx`)

Schema:
```json
{
  "questions": [
    { "prompt": "Qual é uma emoção?", "options": ["Alegria","Mesa","Azul"], "correctIndex": 0, "explanation": "..." }
  ],
  "shuffleOptions": true,
  "showExplanation": true
}
```
- Uma pergunta por vez, feedback imediato (verde/vermelho), botão "Próxima".
- Eventos: `question_shown`, `answer_selected` (com correto/incorreto), `question_completed`.
- Score = acertos; maxScore = total de perguntas.

### 2. Motor Memória (`src/modules/games/engines/memory.tsx`)

Schema:
```json
{
  "pairs": [ { "id":"cat", "label":"Gato", "emoji":"🐱" } ],
  "gridSize": "4x4",
  "timeLimitSec": 120
}
```
- Grid de cartas viradas; clicar vira; 2 cartas por vez; par correto fica revelado.
- Eventos: `card_flipped`, `pair_matched`, `pair_missed`.
- Score = pares encontrados; bônus de tempo no metadata.

### 3. Motor Arrastar-e-Soltar (`src/modules/games/engines/drag_drop.tsx`)

Schema:
```json
{
  "prompt": "Classifique os animais",
  "buckets": [ { "id":"aquatic", "label":"Aquáticos" }, { "id":"terrestrial", "label":"Terrestres" } ],
  "items": [ { "id":"fish", "label":"Peixe", "emoji":"🐟", "correctBucket":"aquatic" } ]
}
```
- HTML5 drag-and-drop com fallback tap-to-select (acessibilidade + mobile).
- Eventos: `item_dropped` (bucket correto/incorreto), `round_completed`.
- Score = itens no bucket correto; maxScore = total de itens.

### 4. Registro e ativação

- Registrar os três motores no `engine-registry` com `schema` exposto (para o editor JSON do admin já mostrar o formato esperado).
- Migration curta: `UPDATE game_engines SET active = true WHERE code IN ('quiz','memory','drag_drop')` e atualizar `schema` de cada linha para refletir o JSON acima.

### 5. Seeds de conteúdo (opcional, no mesmo migration)

Três jogos publicados de exemplo para o `/kid/jogos` já ter conteúdo real:
- Quiz de emoções (5 perguntas)
- Memória de animais (8 pares)
- Classificar objetos por cor (drag-and-drop)

### 6. Acessibilidade e UX

- Todos os motores: navegação por teclado, `aria-label` em cartas/itens, foco visível, tamanhos ≥ 44px, feedback sonoro opcional desligado por padrão.
- Respeitar `prefers-reduced-motion` (sem animações de flip agressivas).

### Fora do escopo desta sprint

- Motores adicionais (sequência, categorização avançada, história ramificada) ficam para Sprint 3.
- Editor visual (drag-and-drop de perguntas no admin) — segue por enquanto via JSON no editor atual.
- Analytics agregado por motor no painel admin — Sprint 4.

### Verificação final

1. Admin cria um Quiz com 3 perguntas → publica.
2. Criança abre `/kid/jogos`, joga, recebe pontuação e estrelinhas.
3. Repetir para Memória e Drag-and-Drop.
4. Conferir eventos em `game_events` e sessão em `game_sessions`.
