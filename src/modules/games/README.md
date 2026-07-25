# Módulo Games — Plataforma de Jogos Terapêuticos

Filosofia: **novos jogos são criados por configuração JSON, nunca por código**. O código fornece *motores* reutilizáveis; cada jogo é um registro em `content_games` apontando para um motor + um `config` que descreve seu conteúdo.

## Peças

- `game_engines` (DB) — catálogo dos motores registrados (quiz, memória, arrastar-e-soltar, ...). Guarda o JSON Schema aceito.
- `content_games` (DB) — a "ficha" de cada jogo: motor, config, capa, faixa etária, recompensa.
- `game_sessions` / `game_events` (DB) — cada partida jogada, com eventos granulares para IA adaptativa.
- `engines/` — implementações React de cada motor (`EngineDefinition`).
- `registry/engine-registry.ts` — mapa `engineCode → EngineDefinition`.
- `runtime/game-player.tsx` — componente universal que resolve motor, cria sessão, coleta eventos e credita estrelas.
- `api.functions.ts` — server functions `startGameSession`, `recordGameEvent`, `completeGameSession`.

## Contrato do motor

```ts
interface EngineDefinition<TConfig> {
  code: string;
  name: string;
  validateConfig?: (c: unknown) => string | null;
  Component: React.FC<EngineProps<TConfig>>;
  listed: boolean;
}
```

`EngineProps` recebe `config`, `emit(event)`, `onFinish(result)` e `a11y`. O motor é **puro**: não fala com o Supabase. Ele apenas emite eventos e informa o resultado final.

## Como adicionar um motor novo

1. Criar `src/modules/games/engines/<code>.tsx` com um `EngineDefinition`.
2. Definir o JSON Schema em `game_engines.config_schema` (migration).
3. Registrar em `registry/engine-registry.ts` via `registerEngine(...)`.
4. Marcar `active = true` na tabela `game_engines`.
5. Cadastrar um jogo em `/admin/games` escolhendo esse motor.
6. Testar em `/kid/jogos`.

## Ciclo de vida de uma sessão

```
[/kid/jogos] escolhe jogo
   ↓
GamePlayer.mount → startGameSession RPC → sessionId
   ↓
Motor roda; cada interação → recordGameEvent
   ↓
Motor chama onFinish(result)
   ↓
completeGameSession RPC → credita estrelas via add_kid_stars → tela de recompensa
```

Se o usuário sair no meio, `GamePlayer` chama `completeGameSession` com `status: "abandoned"`, `score: 0` (sem estrelas).

## Recompensas

Definidas 100% no servidor (`complete_game_session`): `stars = round(stars_reward * score / max_score)`, mínimo 1 quando `status = 'completed'`. Cliente nunca decide quantas estrelas dar.
