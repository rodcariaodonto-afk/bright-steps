
# O que falta para o Meu Mundo Azul estar pronto

## 📊 Estado atual (verificado)

**✅ Pronto:**
- Fundação técnica: TanStack Start, Tailwind, shadcn/ui, i18n (pt-BR), rotas modulares (`/`, `/auth`, `/app`, `/pro`, `/admin`).
- Rebranding completo (Meu Mundo Azul + símbolo do infinito, IA "Azul").
- Auth real: Lovable Cloud ativado, Google OAuth + e-mail/senha, gate em `/app`, `/pro`, `/admin`.
- Papéis: enum `app_role`, tabela `user_roles`, função `has_role`, trigger que promove `rodcaria.odonto@gmail.com` a admin.
- `profiles` com RLS por dono, `useSession` + `UserMenu` funcionais.
- Núcleo de IA (`src/modules/ai/`): gateway, personas, memória em sessão, engines de personalização e dificuldade adaptativa, guardrails LGPD, telemetria local.
- 3 chats de IA funcionais (Família, Clínico, Admin) via gateway central.
- Landing page, dashboards Família/Pro/Admin com mocks visuais.
- ~50 rotas criadas com shells corretos.

**❌ Falta (o grosso do produto):**
- **Persistência real**: nenhuma tabela de domínio existe (só `profiles` e `user_roles`). Tudo hoje é mock ou sessionStorage.
- **~40 rotas são `PlaceholderPage`**: rotina, medicação, humor, comportamento, objetivos, timeline, calendário, documentos, relatórios, notificações, configurações — todas vazias.
- **Módulo Criança inteiro**: avatar, mundo lúdico, IA-personagem, jogos, histórias interativas — não existe.
- **Módulo Escola**: nem sequer scaffold.
- **Tools de IA** (function calling): planejadas mas nunca criadas.
- **Marketplace, Comunidade, Gamificação, Notificações, Billing**: só types/repositórios mockados, sem UI nem persistência.
- **Storage**: nenhum bucket criado (avatares, documentos, mídia de sessão).
- **CMS admin**: 24 rotas admin vazias.
- **Integrações**: nenhuma (pagamento, calendário, e-mail transacional).

---

## 🎯 Ondas propostas

Cada onda entrega valor de ponta a ponta. Ordem escolhida por dependência técnica e impacto para o usuário final.

### Onda A — Perfil da Família + Criança (dados reais)
**Objetivo:** sair do mock. Sem isso, nada mais faz sentido persistir.

Novas tabelas (migration única, com RLS + GRANTs):
- `families` (nome, timezone, dono)
- `family_members` (papel: guardião, responsável, cuidador; vínculo com `auth.users`)
- `children` (nome, data nasc., condições declaradas, avatar, tema de interesse)
- `child_guardians` (quem pode ver/editar qual criança + permissões)
- `consent_records` (versionado por campo/finalidade; pré-requisito LGPD)

Telas:
- `/app/crianca`: CRUD de crianças (criar, editar, foto).
- `/app/configuracoes`: perfil da família, membros, convites por e-mail.
- Seletor de "criança ativa" no topo do AppShell (alimenta todo o contexto downstream).

Buckets Storage: `avatars`, `children` (privados, URLs assinadas).

### Onda B — Rotina de vida (medicação, humor, comportamento, timeline)
**Objetivo:** o coração diário do app família.

Tabelas:
- `medications` + `medication_doses` (agenda + registro de tomada)
- `mood_entries` (humor da criança, 1x+ por dia)
- `behavior_events` (crise, conquista, gatilho, contexto)
- `routines` + `routine_items` (rotina visual da criança)
- `timeline_events` (view materializada agregando tudo acima)

Telas com CRUD real:
- `/app/medicacao`, `/app/humor`, `/app/comportamento`, `/app/rotinas`, `/app/timeline`, `/app/calendario`.
- Widgets do dashboard `/app` puxando dados reais.

Tools de IA (`src/modules/ai/tools/family/`):
- `get_child_summary`, `get_recent_mood`, `get_medication_status`, `suggest_routine_adjustment`.
- Persona Família passa a responder com base nos dados reais.

### Onda C — Objetivos, Documentos, Relatórios (Família ↔ Profissional)
**Objetivo:** conectar as duas experiências que hoje vivem separadas.

Tabelas:
- `goals` + `goal_progress` (metas terapêuticas compartilhadas)
- `documents` (laudos, receitas, relatórios; bucket `documents` privado)
- `reports` (gerados por IA com aprovação humana)
- `professionals` + `professional_child_links` (quem atende quem, com autorização da família)

Telas família: `/app/objetivos`, `/app/documentos`, `/app/relatorios`, `/app/notificacoes`.
Telas pro: `/pro/pacientes`, `/pro/pacientes/$childId`, `/pro/evolucao`, `/pro/objetivos`, `/pro/relatorios`, `/pro/documentos`.

Cron via `pg_cron`: geração semanal de resumo por criança (`ai_summaries`).

### Onda D — Sessões clínicas + Agenda + Escalas
**Objetivo:** completar o módulo Profissionais.

Tabelas:
- `sessions` (áudio, vídeo, transcrição, notas SOAP)
- `appointments` (agenda inteligente com conflitos)
- `assessment_scales` + `scale_applications` (M-CHAT, ADOS parcial, etc.)
- `professional_indicators` (ocupação, adesão, evolução — view)

Storage: buckets `sessions`, `medical`.

Telas pro: `/pro/agenda`, `/pro/sessoes/nova`, `/pro/sessoes/$id`, `/pro/escalas`, `/pro/indicadores`.

Tools de IA clínicas: `draft_soap_note`, `compare_periods`, `suggest_intervention`.

### Onda E — Módulo Criança (mundo lúdico + IA-personagem)
**Objetivo:** o diferencial competitivo do produto.

Novo subtree `/child/*` isolado (sem reuso de família/pro):
- Login por PIN/foto (Cloud Auth com custom claim `is_child`).
- Avatar customizável, mundo lúdico com temas por interesse dominante.
- IA "Azul" como personagem (persona `child`, tom lúdico, sem jargão).
- Jogos adaptativos (usa `difficulty-engine` já pronto).
- Histórias interativas (usa `interest-engine` já pronto).
- Moeda virtual + conquistas (tabelas `virtual_currency_wallets`, `currency_transactions`, `achievements`, `achievement_unlocks`).

Tabelas de suporte: `child_interests`, `child_favorites`, `stories`, `story_scenes`, `games`, `game_sessions`, `missions`, `mission_progress`, `seasonal_events`.

Bucket: `stories`.

### Onda F — Painel Admin real + CMS + Analytics
**Objetivo:** operar a plataforma.

- Preencher as 24 rotas `/admin/*` hoje vazias com CRUDs e dashboards reais.
- CMS interno para histórias, jogos, missões, eventos sazonais.
- Analytics: `analytics_events` particionada + dashboards MAU/DAU/retenção/churn.
- Feature flags, backups, logs, moderação de comunidade.
- Persona Azul Admin com tools de análise financeira e detecção de erros.

### Onda G (opcional) — Escola, Comunidade, Marketplace, Billing
**Objetivo:** expandir ecossistema.

- Módulo Escola: `/school/*` para professores acompanharem alunos autorizados.
- Comunidade: grupos, publicações, moderação.
- Marketplace: catálogo + pedidos (integração Stripe ou Mercado Pago — decisão do usuário).
- Billing: planos (Grátis/Família/Profissional/Escola/Clínica), assinaturas, cupons.
- E-mail transacional (via connector de e-mail).

---

## ⚠️ Decisões que preciso do Rodrigo antes de começar

1. **Escopo do MVP público:** só Ondas A–D (Família + Profissional funcionais) já é lançável. Ondas E–G podem virar release 2. Confirma essa priorização ou quer Criança (E) antes?
2. **Pagamento:** quando chegar em Onda G, Stripe ou Mercado Pago?
3. **E-mail transacional:** Resend (Lovable Cloud managed) ou outro?
4. **Convites de família/profissional:** por link mágico ou por código de convite?

---

## 🔧 Detalhes técnicos (para referência)

- Toda tabela nova segue padrão: `id uuid`, `created_at/updated_at/deleted_at`, `created_by/updated_by`, RLS enable, GRANTs explícitos (`authenticated` + `service_role`), políticas via `has_role` ou vínculo direto.
- Repositórios mockados de hoje (`src/modules/*/repositories`) trocam mock por chamadas Supabase — 1 linha por método, componentes não mudam.
- Server functions em `src/lib/*.functions.ts` para leituras autenticadas; `pg_cron` + `/api/public/hooks/*` para jobs agendados.
- Storage buckets criados por migration; todos privados com URLs assinadas curtas.
- Cada onda termina com typecheck limpo + smoke test Playwright dos fluxos-chave.

---

## 📅 Sugestão de próximo passo

Começar pela **Onda A** (Perfil + Criança) — é pré-requisito de todas as outras e desbloqueia a experiência "família de verdade" já na próxima entrega. Se topar, respondo com a migration da Onda A + telas de CRUD de criança e configurações da família.

**Confirma essa ordem (A → B → C → D → E → F → G) ou quer reordenar?**
