## Objetivo
Deixar o Painel Admin 100% funcional como Super Admin, cobrindo as abas ainda em placeholder (Notificações, Analytics, Relatórios) e adicionando ações de criação em Pessoas (Usuários, Profissionais, Escolas, Famílias, Crianças).

## Escopo

### 1. Aba Notificações (`/admin/notifications`)
- Server functions: `listAllNotifications` (últimas 200, com filtro por tipo e status lido/não), `broadcastNotification` (envia para todos os usuários OU segmento: `admin | professional | family`), `deleteNotificationAdmin`.
- UI: tabela de notificações recentes + botão "Nova notificação" abre dialog com formulário (título, corpo, prioridade, tipo, público‑alvo, link opcional). Toast + refresh após envio.

### 2. Aba Analytics (`/admin/analytics`)
- Server function `getAnalyticsOverview` agregando dados reais do banco:
  - Séries diárias 30d de novos usuários, novas famílias, novas crianças, sessões clínicas concluídas, jogos concluídos.
  - Top 5 jogos por sessões, top 5 histórias por leituras, distribuição de humor 30d, MRR ativo por plano.
- UI com KPIs + gráficos (Recharts já instalado): line, bar, pie.

### 3. Aba Relatórios (`/admin/reports`)
- Server functions:
  - `listAdminReports` (lê `public.reports`).
  - `exportPlatformReport({ range, type })` gera CSV consolidado (usuários, famílias, receita, sessões) — retorna string CSV.
- UI: seletor de período (7/30/90 dias) + tipo de relatório + botão "Gerar CSV" (download client‑side) + lista dos relatórios já gerados em `reports`.

### 4. Ações de criação em Pessoas
Adicionar botão "Adicionar" + dialog em cada tela; usar `supabaseAdmin` no server, sempre após `ensureAdmin`, e registrar em `admin_audit_log`.

- **Usuários** (`/admin/users`): "Novo usuário" via `supabaseAdmin.auth.admin.createUser` (email, senha temp, full_name, roles múltiplas: admin/professional). Trigger existente cria profile. Também botão inline "Editar papéis" por linha (adicionar/remover role em `user_roles`).
- **Profissionais** (`/admin/professionals`): "Cadastrar profissional" — cria auto usuário (se e‑mail não existir) + `professional_profiles` (nome, conselho, número, estado, especialidades, bio) já com `moderation_status='approved'` e role `professional`.
- **Escolas** (`/admin/schools`): "Vincular escola" — selecionar criança existente + preencher escola/série/turma/professor e inserir em `school_profiles`.
- **Famílias** (`/admin/families`): "Nova família" — selecionar owner existente por e‑mail + nome.
- **Crianças** (`/admin/children`): "Nova criança" — selecionar família + nome, apelido, data de nascimento, condições declaradas.

### 5. Ajustes menores
- Corrigir string "E,mail" na tabela de usuários.
- Adicionar chaves i18n necessárias em `pt-BR/admin.json` (títulos, botões, colunas).

## Detalhes técnicos
- Novos arquivos:
  - `src/modules/admin/notifications.functions.ts`
  - `src/modules/admin/analytics.functions.ts`
  - `src/modules/admin/reports.functions.ts`
  - `src/modules/admin/people.functions.ts` (create user/professional/school/family/child + set roles)
- Reescrita das rotas: `admin.notifications.tsx`, `admin.analytics.tsx`, `admin.reports.tsx`, e atualização com dialogs de criação nas 5 rotas de Pessoas.
- Todas as server fns: `.middleware([requireSupabaseAuth])` + `ensureAdmin` + `supabaseAdmin` carregado dentro do handler; logs em `admin_audit_log`.
- Gráficos usando Recharts (já no projeto).
- Sem alteração de schema — as tabelas necessárias já existem (`notifications`, `reports`, `user_roles`, `professional_profiles`, `school_profiles`, `families`, `children`, `admin_audit_log`).

## Fora de escopo
- Segmentação avançada de notificações (por família específica) — apenas broadcast por role nesta iteração.
- Editor visual de relatórios agendados / cron.
- Edição inline completa de todos os campos das entidades (apenas criação + campos essenciais).
