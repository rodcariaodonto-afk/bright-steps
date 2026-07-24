## Onda P.3 — Insights automáticos de padrões

Único item pendente da Onda P. Fecha o ciclo de conteúdo/autoavaliação/bem‑estar iniciando o motor que lê os dados já registrados e devolve padrões acionáveis para família e profissional.

### Objetivo
Analisar os últimos 30 dias de `behavior_events`, `mood_logs` e `medication_logs` de uma criança e produzir 3 a 6 "padrões detectados" em linguagem cuidadosa (ex.: "gatilho sensorial mais frequente: barulho, principalmente após 18h"), com sugestão de artigo da biblioteca quando fizer sentido.

### Entregáveis

1. **Migration** `insights_cache`
   - Colunas de domínio: `child_id`, `generated_by`, `insights` (jsonb — lista de `{title, description, evidence, suggested_article_slug?}`), `range_start`, `range_end`, `model`, `expires_at`.
   - RLS: leitura/escrita apenas por quem passa em `can_access_child(child_id, auth.uid())`.
   - GRANTs padrão + trigger `updated_at`.
   - Índice `(child_id, generated_at desc)` para pegar o mais recente rápido.

2. **Server functions** em `src/modules/insights/api.functions.ts`
   - `getChildInsights({ childId })`: retorna cache válido (≤ 24h) ou dispara geração.
   - `generateChildInsights({ childId, force? })`: agrega os últimos 30 dias via `context.supabase` (RLS como usuário), monta prompt determinístico, chama Lovable AI Gateway com `google/gemini-2.5-flash` via `runAtlasStream`/helper equivalente em modo não‑stream, valida JSON, grava em `insights_cache`.
   - Todas com `.middleware([requireSupabaseAuth])`.
   - Prompt reforça guardrails: sem diagnóstico, tom acolhedor PT‑BR, cita evidência (contagens/horários), sugere artigo da biblioteca só se houver categoria compatível.

3. **UI**
   - Novo componente `PatternsCard` (`src/components/insights/patterns-card.tsx`) com estados vazio/carregando/erro, botão "Atualizar padrões", chips por padrão e link para artigo sugerido (`/app/biblioteca/$slug`).
   - Encaixar no dashboard família (`src/routes/app.index.tsx`) e no perfil do paciente do profissional (`src/routes/pro.pacientes.$childId.tsx`), ambos usando `useActiveChild` / `childId` da rota.

4. **Locales** `src/locales/pt-BR/app.json`
   - Bloco `insights.*` com títulos, estados vazios e aviso "isto não é diagnóstico".

### Detalhes técnicos
- Módulo `src/modules/insights/` novo; nada em `src/server/`. Handlers leem `process.env.LOVABLE_API_KEY` dentro do `.handler`.
- Cache: `expires_at = now() + interval '24 hours'`; `force=true` ignora cache.
- Agregações feitas em SQL (contagens por gatilho, hora do dia, humor médio, adesão à medicação) para manter o prompt curto e barato.
- Se não houver dados suficientes (< 5 registros somados), retornar lista vazia com mensagem "Ainda não há dados suficientes" — sem chamar IA.
- Sem novas dependências.

### Fora do escopo
- Job agendado (pg_cron) — geração continua on‑demand com cache de 24h.
- Insights cross‑criança / populacionais.
- Notificações push quando um novo padrão surge.

Depois desta onda, todos os itens do plano `.lovable/plan.md` (P.1–P.5) estarão entregues.