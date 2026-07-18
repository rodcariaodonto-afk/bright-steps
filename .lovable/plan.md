
# Ciclo 3 — Núcleo de Inteligência Artificial (e fundações para tudo mais)

Este ciclo trata a IA como **núcleo** da plataforma, não como feature. Toda a arquitetura passa a girar em torno de três coisas:

1. **Contexto autorizado** — a IA sempre recebe (e só recebe) dados que a família/profissional/escola autorizou, por LGPD.
2. **Memória contextual persistente** — a IA lembra criança, interesses, rotina, evolução, conquistas e nunca fala como conversa nova.
3. **Personas especializadas** — mesma engine, prompts, ferramentas e guardrails diferentes por público (Criança, Família, Profissional, Escola, Admin).

Em paralelo, o ciclo abre as fundações que o briefing exige: gamificação, moeda virtual, conquistas, marketplace, comunidade, notificações inteligentes, planos/assinaturas, analytics e painel admin. Tudo com **arquitetura pronta**, ligando peça por peça conforme o Cloud volta.

> **Pré-requisito honesto:** memória persistente, RLS, buckets, planos e analytics reais exigem Lovable Cloud. Hoje o workspace está sem saldo. A Onda 1 entrega TUDO o que roda sem persistência (arquitetura de IA, personas, memória em sessão, personalização, recomendação, admin scaffold). Ondas 2–5 ligam quando o Cloud voltar, sem retrabalho — repositórios já ficam com interface pronta.

---

## Arquitetura de IA (`src/modules/ai/`)

Novo módulo `core` que todos os outros consomem — nenhuma tela chama `streamText` direto.

```
src/modules/ai/
├── personas/          # Atlas Família, Atlas Clínico, Atlas Criança, Atlas Escola, Atlas Admin
│   ├── family.ts      # system prompt + tools + guardrails + tom
│   ├── clinical.ts
│   ├── child.ts       # nunca soa robótico; fala como personagem
│   ├── school.ts
│   └── admin.ts
├── context/           # montagem do contexto autorizado
│   ├── builder.ts     # recebe (persona, userId, childId) → retorna ContextBundle
│   ├── redactor.ts    # remove PII quando desnecessário
│   └── consent.ts     # verifica consent_records antes de expor cada campo
├── memory/            # memória contextual
│   ├── short-term.ts  # janela da conversa atual
│   ├── long-term.ts   # resumos periódicos por criança/usuário
│   └── episodic.ts    # fatos-âncora ("gosta de dinossauros", "dorme mal se dorme tarde")
├── tools/             # function calling — cada tool é auditável
│   ├── family/        # get_child_summary, get_recent_mood, suggest_routine, ...
│   ├── clinical/      # get_session_history, compare_periods, draft_report, ...
│   ├── child/         # unlock_reward, remember_favorite, tell_story, ...
│   └── shared/        # search_content, get_goals, get_medications, ...
├── recommendations/   # motor de recomendação (histórias, jogos, atividades, metas)
├── adaptive/          # motor de dificuldade dinâmica (jogos/atividades)
├── personalization/   # tema/ilustração/narrativa por interesse dominante
├── prompts/           # blocos reutilizáveis (LGPD, anti-diagnóstico, tom)
├── telemetry/         # eventos de uso da IA (custo, latência, satisfação)
└── gateway.ts         # única fachada para streamText/generateText — passa por aqui
```

Regras invioláveis:
- Toda chamada de IA passa por `runAtlas({ persona, userId, childId, input })` — nenhum componente monta prompt sozinho.
- `context/builder` **sempre** verifica `consent_records` antes de incluir cada campo. Sem consentimento, o campo simplesmente não entra.
- Nenhuma persona pode diagnosticar, prescrever ou substituir profissional — bloco de guardrails compartilhado em `prompts/guardrails.ts`.
- Toda tool que grava algo (`unlock_reward`, `draft_report`, etc.) exige aprovação humana via `needsApproval` do AI SDK.
- Telemetria captura custo/latência/tokens por persona → alimenta o painel admin futuro.

---

## Módulos de negócio abertos neste ciclo (esqueleto + repositórios)

Cada um segue o padrão do Ciclo 2: `types → schemas Zod → repositories (mock) → services → components → rotas`. Trocar mock por Supabase é 1 linha por método.

- `src/modules/gamification/` — moeda virtual (nome configurável por tema: Estrelas/Cristais/Folhas), conquistas ilimitadas, missões, eventos sazonais (Natal, Páscoa, Dia das Crianças, aniversário da criança).
- `src/modules/marketplace/` — catálogo (livros, histórias, jogos, cursos, imprimíveis, planos terapêuticos, CAA), autores, avaliações, pedidos.
- `src/modules/community/` — grupos públicos/privados, publicações, comentários, curtidas, seguir especialistas, moderação.
- `src/modules/notifications/` — motor que decide **quando** e **o quê** notificar (IA prioriza), canais (in-app, email, push futuro).
- `src/modules/billing/` — planos (Grátis, Família, Profissional, Escola, Clínica, Institucional), assinaturas (mensal/semestral/anual/vitalício), cupons, trial, upgrade/downgrade. Sem gateway real ainda.
- `src/modules/analytics/` — event bus tipado (`track(event, props)`), buffer local até Cloud, contratos prontos para MAU/DAU/retenção/LTV/CAC.
- `src/modules/admin/` — módulo isolado em `/admin/*` com shell próprio (nada reutilizado de família/pro), 20+ rotas placeholder (Usuários, Famílias, Crianças, Profissionais, Escolas, Marketplace, Comunidade, Assinaturas, Financeiro, Cupons, Notificações, Relatórios, Analytics, Conteúdo/CMS, IA, Logs, Configurações Globais, Feature Flags, Permissões, Backups).
- `src/modules/rbac/` — matriz de papéis (Global Admin, Admin, Gestor, Família, Responsável, Cuidador, Profissional, Escola, Professor, Criança, Moderador, Visitante) + helper `can(user, action, resource)`. Nada hardcoded.

---

## Personalização & Aprendizagem Adaptativa

Duas engines separadas, ambas mockadas na Onda 1:

- **`personalization/interest-engine.ts`** — mantém `dominantInterest` por criança (dinossauros, princesas, espaço, carros…) e expõe helpers `pickTheme()`, `pickIllustration()`, `pickNarrator()`, `pickReward()`. Histórias/jogos/mensagens consultam antes de renderizar. Sem interesse definido, cai em tema neutro acolhedor.
- **`adaptive/difficulty-engine.ts`** — recebe sinais (`timeToAnswer`, `errors`, `hits`, `persistence`, `sessionDuration`, `timeOfDay`) e devolve `nextLevel`, `challengeCount`, `timeLimit`, `complexity`, `stimulusType`. Nenhum jogo terá nível fixo.

---

## Dados que entram quando o Cloud voltar (Onda 2+)

Tudo com `id uuid`, `created_at/updated_at/deleted_at`, `created_by/updated_by`, `status`, RLS + GRANTs, FKs, índices.

Novas tabelas específicas do núcleo de IA:
- `ai_memories` — memórias episódicas por criança/usuário (`kind`, `content`, `confidence`, `source`, `expires_at`).
- `ai_summaries` — resumos de longo prazo (semanal/mensal) por criança, gerados por job.
- `ai_conversations` + `ai_messages` — histórico por persona (família/clínico/criança/escola/admin), separados por RLS.
- `ai_tool_calls` — auditoria de toda chamada de tool (input, output, aprovador, custo).
- `ai_usage_events` — telemetria (tokens, latência, modelo, custo).
- `consent_records` — versionado, por campo/finalidade.
- `child_interests` + `child_favorites` — alimentam personalização.
- `virtual_currency_wallets` + `currency_transactions` — moeda virtual (nunca com valor financeiro).
- `achievements` + `achievement_unlocks` — conquistas ilimitadas por categoria.
- `missions` + `mission_progress`.
- `seasonal_events` + `event_participations`.
- `marketplace_products` + `product_categories` + `authors` + `orders` + `order_items` + `reviews`.
- `community_groups` + `posts` + `comments` + `likes` + `follows` + `moderation_actions`.
- `notification_preferences` + `notifications` + `notification_deliveries`.
- `plans` + `subscriptions` + `invoices` + `coupons` + `payment_methods` (schema pronto, gateway depois).
- `analytics_events` (particionada por mês).
- `audit_logs` (já reservada) + `system_logs`.
- `feature_flags` + `global_settings`.

Buckets Storage a criar: `avatars`, `children`, `documents`, `medical`, `stories`, `marketplace`, `community`, `videos`, `audio`, `reports`, `temp`. Todos privados, URLs assinadas.

---

## Ondas de execução

**Onda 1 — Núcleo de IA + fundações (executa AGORA, sem Cloud)**
- Cria `src/modules/ai/` inteiro (personas, context builder mock, memória em `sessionStorage`, guardrails compartilhados, telemetria local).
- Refatora `src/routes/api/chat.ts` e `src/routes/app.ia.tsx` para usar `runAtlas({ persona: "family", ... })` — mesma UX, agora canônica.
- Refatora `src/routes/pro.ia.tsx` para usar `persona: "clinical"` com tools clínicas (mock).
- Adiciona seletor de criança ativa no shell da família → alimenta contexto da IA automaticamente.
- Cria `personalization/` e `adaptive/` com engines e testes unitários.
- Cria esqueleto de `gamification/`, `marketplace/`, `community/`, `notifications/`, `billing/`, `analytics/`, `rbac/` (types + schemas + repositories mock + services).
- Cria módulo `admin/` isolado em `/admin/*` com AdminShell próprio + 20+ rotas placeholder bem estruturadas (não genéricas).
- i18n: novos namespaces `ai`, `admin`, `marketplace`, `community`, `gamification`, `billing`.
- Banner "Modo prévia" continua enquanto Cloud está fora.

**Onda 2 — Memória persistente + Consentimento + Auditoria (após Cloud)**
- Migração: `consent_records`, `ai_memories`, `ai_summaries`, `ai_conversations`, `ai_messages`, `ai_tool_calls`, `ai_usage_events`, `audit_logs`.
- RLS estrito: memória de uma criança só é lida por quem tem vínculo autorizado.
- Job diário que gera `ai_summaries` (server function agendada via `pg_net` → server route).
- Todas as tools mutantes passam a exigir aprovação e gravam em `ai_tool_calls`.

**Onda 3 — Personalização real + Gamificação + Conquistas + Eventos**
- Migração: `child_interests`, `child_favorites`, `virtual_currency_wallets`, `currency_transactions`, `achievements`, `achievement_unlocks`, `missions`, `mission_progress`, `seasonal_events`.
- Motor de recomendação passa a ler histórico real; conquistas disparam por triggers.
- Primeiros eventos sazonais cadastrados via CMS admin.

**Onda 4 — Marketplace + Comunidade + Notificações Inteligentes**
- Migração completa dos três módulos + moderação.
- Motor de notificações prioriza via IA (rotina, medicação, consulta, marketplace, mensagens) respeitando `notification_preferences`.
- Busca inteligente unificada (histórias, jogos, docs, publicações, profissionais, marketplace, relatórios, atividades) via server function + reranking por IA.

**Onda 5 — Planos/Assinaturas + Analytics + Painel Admin + IA Administrativa**
- Migração de `plans`, `subscriptions`, `invoices`, `coupons`, `analytics_events` (particionada), `feature_flags`, `global_settings`.
- Integração de pagamento (Stripe ou Mercado Pago — decidir com o usuário quando chegar a hora).
- Dashboards admin (MAU/DAU/retenção/churn/LTV/CAC/receita) com Recharts.
- Persona **Atlas Admin**: resumo semanal, análise financeira, detecção de erros, sugestões, previsões.
- Testes Playwright dos fluxos críticos ponta-a-ponta.

---

## Segurança & LGPD (transversal a todas as ondas)

- Consentimento versionado por campo/finalidade em `consent_records` — IA nunca lê campo sem consent válido.
- Toda leitura de dado sensível de menor gera `audit_logs`.
- Redator remove nome/idade/endereço do prompt quando não são necessários para a resposta.
- Rate limit por usuário/persona no gateway de IA.
- Buckets privados, URLs assinadas curtas, validação de MIME e antivírus futuro.
- MFA reservado (schema pronto), ativação em ciclo posterior.

## Detalhes técnicos (para o time)

- Fachada única: `runAtlas()` em `src/modules/ai/gateway.ts` — recebe persona, monta contexto autorizado, injeta memória, aplica guardrails, escolhe modelo (`google/gemini-3.5-flash` para chat rápido, `openai/gpt-5.4` para redação clínica, `openai/gpt-5.6-luna` para criança — decisão dentro do módulo, nunca no componente).
- Memória curta em `sessionStorage` na Onda 1; migra para `ai_memories` na Onda 2 sem tocar em componentes (interface do repository não muda).
- Tools do AI SDK definidas com Zod, `stopWhen: stepCountIs(50)`.
- Admin em `/admin/*` fica aberto agora com banner de prévia; migra para `_authenticated/admin/*` com gate `has_role('admin')` na Onda 2.
- `analytics/track()` hoje só grava em memória + console; na Onda 5 despacha para `analytics_events` em batch.

## Fora deste ciclo (reservado, não implementado)

- Módulo Criança completo (avatar, mundo lúdico, jogos, histórias interativas) — vira Ciclo 4, já com engines de personalização/adaptativa/recomendação prontas deste ciclo.
- Módulo Escola completo — Ciclo 5.
- Integrações externas (Google/Apple Calendar, Drive, Stripe, WhatsApp, etc.) — só quando cada uma for pedida.
- PWA / Capacitor / apps nativos — depois do MVP validado.

---

**Confirma?** Se sim, executo a Onda 1 completa agora (núcleo de IA + fundações + admin scaffold, tudo sem depender de Cloud). Ondas 2–5 disparam assim que o Cloud reativar, sem retrabalho.
