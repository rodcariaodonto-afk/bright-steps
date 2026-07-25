## Painel Admin — Super Admin funcional (Sistema completo)

Vou transformar as 4 páginas placeholder da seção **Sistema** em painéis reais, adicionar gestão completa de usuários (criar, convidar, suspender, deletar) e permitir conceder assinaturas de cortesia. Tudo protegido por `has_role(auth.uid(), 'admin')` no servidor.

### 1. Banco de dados (migration única)

- **`feature_flags`**: `key`, `enabled`, `description`, `updated_at`, `updated_by`. RLS: leitura autenticada, escrita só admin. Seed com flags iniciais (`ai_family`, `ai_pro`, `ai_child`, `marketplace`, `community`, `messaging`, `library`, `assessments`, `signups_open`).
- **`app_settings`**: chave/valor JSON (`support_email`, `app_name`, `terms_url`, `privacy_url`, `default_trial_days`, `max_children_per_family`). RLS admin-only para escrita, leitura autenticada.
- **`admin_audit_log`**: `actor_id`, `action`, `target_type`, `target_id`, `metadata`, `created_at`. RLS admin-only.
- **`complimentary_subscriptions`**: marca assinatura de cortesia (`user_id`, `plan`, `granted_by`, `expires_at NULL = vitalícia`, `revoked_at`).
- Atualizar `has_active_subscription` e `get_active_plan` para considerar cortesia ativa.
- Trigger de bootstrap: promover automaticamente `caria@axhub.com.br` a **admin** quando o email for confirmado (mesmo padrão do `grant_admin_for_founder`).

### 2. Server functions (`src/modules/admin/*.functions.ts`)

Todas com `requireSupabaseAuth` + checagem `has_role admin` + log em `admin_audit_log`:

- `createUser({ email, password, fullName, roles[] })` → usa `supabaseAdmin.auth.admin.createUser` (`email_confirm: true`).
- `inviteUserByEmail({ email, roles[] })` → `supabaseAdmin.auth.admin.inviteUserByEmail`.
- `updateUserRoles({ userId, roles[] })` → substitui roles do usuário.
- `suspendUser({ userId, banDurationHours })` → `updateUserById({ ban_duration })`.
- `deleteUser({ userId })` → `deleteUser` (cascade LGPD).
- `grantComplimentary({ userId, plan, expiresAt })` / `revokeComplimentary({ userId })`.
- `listFeatureFlags` / `setFeatureFlag({ key, enabled })`.
- `listAppSettings` / `updateAppSetting({ key, value })`.
- `listAuditLog({ limit, cursor })`.
- `exportTableCsv({ table })` → whitelist de tabelas, streaming server-side (via server route `/api/admin/export/:table` protegida).

### 3. UI — páginas admin reais

- **`/admin/permissions`**: tabela de usuários com busca, chips de roles, ações (promover admin/moderator/professional, conceder cortesia via modal, suspender, deletar). Botão **"Criar usuário"** e **"Convidar por email"** no topo.
- **`/admin/flags`**: lista de feature flags com toggle inline + descrição + timestamp do último update.
- **`/admin/settings`**: formulário por seção (geral, limites, links legais, suporte) editando `app_settings`.
- **`/admin/backups`**: lista de tabelas com botão "Exportar CSV" e aviso de que restore é feito via Cloud → Advanced settings. Mostra últimas exportações do audit log.
- **`/admin/users`** (já existe): adicionar botões inline (promover, cortesia, suspender) reaproveitando as mesmas server functions.

### 4. Hook e componentes

- `useFeatureFlag(key)` client-side lendo `feature_flags` com Realtime, usado para gatear módulos globalmente no `AppShell`/`ProShell`.
- Modal reutilizável `CreateUserDialog` e `GrantComplimentaryDialog` em `src/components/admin/`.

### 5. Cortesia — comportamento

Admin escolhe caso a caso no modal: campo "Expira em" (data opcional). Quando expira, `has_active_subscription` para de retornar true e o usuário volta ao Free automaticamente. Admin pode revogar antes.

### Ordem de execução

1. Migration (tabelas + trigger + seed + update das funções de subscription).
2. Server functions admin.
3. UI das 4 páginas Sistema + reforço na `/admin/users`.
4. Hook `useFeatureFlag` + integração no gating.
5. Verificação: login como caria@axhub.com.br, criar usuário teste, conceder cortesia, alternar flag, exportar CSV.

### Detalhes técnicos

- `supabaseAdmin` sempre carregado dentro do handler (`await import`).
- Todas as ações destrutivas passam por audit log.
- Exportação CSV via server route em `src/routes/api/admin.export.$table.ts` com `requireSupabaseAuth` inline (verifica bearer + role) e streaming de `COPY (...) TO STDOUT` transformado em Response.
- Nenhuma chave de serviço exposta ao cliente; nenhuma alteração no client.ts autogen.