## Sprint 1 — Infraestrutura da Plataforma de Jogos (integrada ao Meu Mundo Azul)

Objetivo: entregar toda a fundação para que Sprints 2/3/4 apenas adicionem motores e conteúdo, sem refatoração. Nenhum jogo jogável ainda — apenas o "chassi".

Ponto de integração: dentro do Módulo Criança (`/kid`) e do Painel Admin (`/admin/games`). Reaproveita auth, RBAC, Supabase, shadcn, gamificação (kid_rewards) e sessões já existentes.

---

### 1. Banco de dados (uma migration)

Novas tabelas em `public`, com GRANTs + RLS:

- **`game_engines`** — catálogo dos motores disponíveis. Colunas: `code` (unique, ex: `quiz`, `memory`, `drag_drop`), `name`, `description`, `config_schema` (jsonb com JSON Schema do payload), `default_reward`, `active`, `version`, `icon`. Leitura: authenticated. Escrita: admin.
- **Estender `content_games`** (já existe): adicionar `engine_code` (fk lógica para `game_engines.code`), `config` (jsonb — o "corpo" do jogo interpretado pelo motor), `age_min`, `age_max`, `tags text[]`, `estimated_minutes`, `accessibility` (jsonb: `hasAudio`, `hasCaptions`, `highContrast`, `reducedMotion`).
- **`game_sessions`** — cada partida iniciada por uma criança. Colunas: `child_id`, `game_id`, `engine_code`, `started_at`, `ended_at`, `duration_ms`, `status` (`in_progress`/`completed`/`abandoned`), `score`, `max_score`, `stars_awarded`, `difficulty`, `metadata jsonb`. RLS: leitura pelos guardiões da criança (`can_access_child`) + admin; escrita pela sessão do próprio guardião via `can_write_child`.
- **`game_events`** — eventos granulares dentro de uma partida (para a IA da Sprint 4 já ter matéria-prima). Colunas: `session_id`, `event_type` (`answer`, `hint`, `retry`, `pause`, `resume`, `complete`), `payload jsonb`, `elapsed_ms`, `created_at`. Mesma política das sessões.
- **RPC `start_game_session` / `complete_game_session`** — SECURITY DEFINER; a segunda credita estrelas via `add_kid_stars` para não duplicar lógica de recompensa.
- **Seed** dos três motores previstos (`quiz`, `memory`, `drag_drop`) com `active = false` (Sprint 2 ativa quando o código do motor existir).

### 2. Arquitetura de código (client-safe, JSON-first)

Estrutura nova em `src/modules/games/`:

```text
src/modules/games/
  registry/
    engine-registry.ts    ← Map<engineCode, EngineDefinition>
    game-registry.ts      ← carrega content_games ativos + valida config vs schema
  engines/
    types.ts              ← EngineProps, EngineResult, EngineDefinition
    (motores entram aqui na Sprint 2)
  runtime/
    game-player.tsx       ← componente universal: recebe gameId, resolve engine, monta sessão, coleta eventos, credita estrelas
    session-recorder.ts   ← buffer de events + flush
  accessibility/
    a11y-context.tsx      ← preferências (áudio on/off, contraste, motion) persistidas por criança
  audio/
    audio-manager.ts      ← Web Audio API wrapper, pré-carga, mute global
  hooks/
    use-game.ts, use-game-session.ts, use-child-a11y.ts
  api.functions.ts        ← createServerFn: listGames, getGame, startSession, recordEvent, completeSession, adminUpsertGame
```

Regras:
- Cada motor implementa a mesma interface `EngineDefinition` (`code`, `configSchema` Zod, `Component: React.FC<EngineProps>`, `computeResult(events) => EngineResult`).
- `game-player.tsx` é o único ponto que sabe falar com o Supabase — motores são puros: recebem `config`, emitem `events`, retornam `result`.
- Nenhum motor importa outro. Adicionar motor = criar pasta + registrar no `engine-registry`.

### 3. Painel Admin — evoluir `/admin/games`

Trocar o `ContentCrud` genérico atual por um editor específico:

- Seletor de **motor** (dropdown vindo de `game_engines`).
- Campos comuns: título, slug, capa, idade min/max, tags, estrelas, publicado, acessibilidade.
- Campo **config (JSON)** renderizado com editor JSON + validação em tempo real contra o `config_schema` do motor escolhido.
- Botões: **Duplicar**, **Importar JSON**, **Exportar JSON**, **Ativar/Desativar**.
- Enquanto Sprint 2 não entrega motores, o admin ainda pode cadastrar jogos (ficam ocultos no `/kid` porque o motor está inativo).

### 4. Módulo Criança — estante de jogos

Nova rota `/kid/jogos` (e `/kid/jogos/$slug`):
- Estante visual filtrando `content_games` por faixa etária da criança ativa e motores ativos.
- Clicar num jogo abre o `GamePlayer` em tela cheia, com barra de progresso, botão pausar, botão sair (marca `abandoned`).
- Ao concluir: tela de recompensa + estrelas creditadas via RPC.
- Respeita preferências de acessibilidade (áudio, contraste, motion reduzido).

### 5. Documentação da arquitetura

`src/modules/games/README.md` com: filosofia JSON-first, contrato `EngineDefinition`, ciclo de vida de uma sessão, como adicionar um motor novo (checklist de 6 passos), formato do config, política de recompensas.

---

### O que NÃO entra nesta Sprint

- Nenhum motor implementado (`quiz`, `memory`, `drag_drop` ficam `active = false`).
- Nenhum conteúdo real de jogo populado.
- Sem IA adaptativa, sem dashboards de evolução, sem PDF.
- Sem PWA/mobile packaging.

### Critério de conclusão

- Migration aplicada, RLS validada.
- Admin consegue cadastrar um "jogo fantasma" escolhendo um motor, salvando config JSON válido.
- `/kid/jogos` renderiza a estante (vazia enquanto motores estão inativos, com estado empty claro).
- `GamePlayer` monta um motor stub de teste (`echo`, interno, não listado), grava sessão, credita 1 estrela — provando que o pipeline funciona ponta a ponta.
- README publicado.

Depois da sua validação desta Sprint 1, sigo para **Sprint 2 — Motores Quiz + Memória + Arrastar-e-Soltar**.

### Detalhes técnicos (para referência)

- Tabelas seguem o padrão do projeto: `GRANT` explícito, RLS, `updated_at` via `set_updated_at`.
- Server functions em `src/modules/games/api.functions.ts` usam `requireSupabaseAuth`; admin ops checam `has_role(uid,'admin')`.
- `config_schema` é JSON Schema serializado; validação client-side com Ajv (leve) ou Zod-from-JSON-Schema. Escolho na implementação pelo bundle size.
- `game_events` sem RLS pesada em INSERT (usa RPC SECURITY DEFINER que valida `can_write_child` uma vez por sessão) para não estrangular telemetria.
- Zero mudança em Stripe/entitlements — jogos ficam liberados no plano free por padrão; gating por plano fica para depois se você pedir.
