
## Objetivo

Substituir o mock permissivo de `hasConsent()` por consulta real a `public.consent_records` e fazer `buildContext()` omitir campos sensíveis do `ContextBundle` quando não houver consentimento ativo. Fail closed: sem registro → sem dado.

## Estado atual confirmado

- `src/modules/ai/context/consent.ts`: `hasConsent()` retorna `true` para tudo (mock).
- `src/modules/ai/context/builder.ts`: `buildContext()` não lê banco nem consent; monta bundle vazio (sem `childProfile`).
- Tabela `public.consent_records` existe, RLS ativo, colunas relevantes: `subject_user_id`, `subject_child_id`, `scope` (enum), `purpose` (text livre), `granted` (bool), `revoked_at` (nullable). Índices parciais em `(subject_*, scope) WHERE revoked_at IS NULL`.
- Enum `consent_scope`: `ai_context, ai_memory, clinical_share, school_share, marketplace_personalization, community_visibility, analytics, marketing`.
- Assinaturas públicas a preservar: `ContextBundle`, `BuildContextInput`, `buildContext`, `serializeContext`, `ConsentField`, `hasConsent`, `filterByConsent`.

## Mudanças

### 1. `src/modules/ai/context/consent.ts` — query real + fail closed

- Adicionar mapa `ConsentField → { scope: consent_scope, purpose: string }`. Todos os campos `child.*` mapeiam para `scope = 'ai_context'` com `purpose` = nome do campo (`"child.diagnosis"`, etc.). `professional.notes` / `family.notes` idem, com `subject_user_id`.
- `hasConsent(field, ctx)`:
  - Usar o client autenticado do browser (`@/integrations/supabase/client`) — a função é chamada em contexto de request já autenticado (RLS filtra o que o requester pode ver).
  - Query: `select id from consent_records where scope = $scope and purpose = $purpose and granted = true and revoked_at is null and (subject_child_id = $subjectId or subject_user_id = $subjectId) limit 1`.
  - Retornar `true` só se linha existir. Qualquer erro/exception → `false` (fail closed) + `console.warn`.
  - Manter assinatura `(field, ctx) => Promise<boolean>`; manter `filterByConsent` inalterada (já usa `hasConsent`).
- Adicionar helper interno `hasConsentBulk(fields, ctx): Promise<Set<ConsentField>>` para uma query só, evitando N round-trips no `buildContext`.

### 2. `src/modules/ai/context/builder.ts` — gating + omissão

- `buildContext()` passa a aceitar `supabase` client via parâmetro (opcional; se ausente, `childProfile` fica `undefined` — comportamento igual ao atual). Isso evita acoplar o módulo ao client concreto e mantém a assinatura compatível (novo campo opcional).
- Quando `input.childId` presente:
  1. Buscar linha base de `children` (nome, birth_date, nickname, dominant_interest, declared_conditions) — RLS já garante acesso; se `error`/`null`, deixar `childProfile` undefined.
  2. Chamar `hasConsentBulk` para o conjunto: `child.name, child.diagnosis, child.medications, child.goals, child.mood, child.sessions, child.evolution`.
  3. Montar `childProfile` **campo a campo**, incluindo cada chave apenas se o consent correspondente estiver no set. Sem consent para `child.name` → nem `firstName` é incluído; nesse caso o `childProfile` inteiro é omitido (bundle sem dado da criança).
  4. Popular `diagnoses` só se `child.diagnosis` liberado; `activeMedications` só se `child.medications` liberado (query em `medications` where `child_id = ... and active`); `activeGoals` só se `child.goals` liberado; `lastMoodTrend` só se `child.mood` liberado; `lastSessionSummary` só se `child.sessions` liberado.
- Para `requesterRole` `"school"` e `"professional"`: além do consent por campo, exigir consent com scope `school_share` / `clinical_share` respectivamente (via `hasConsent` sobre `subject_child_id`). Falha → `childProfile` inteiro omitido, independente dos consents granulares.

### 3. Guard da persona `child` em `serializeContext`

- Em `serializeContext(bundle)`, quando `bundle.requesterRole === "child"`, filtrar `childProfile` antes de renderizar: remover `diagnoses`, `activeMedications`, `activeGoals`, `lastSessionSummary`, `lastMoodTrend` incondicionalmente. Manter apenas `firstName`, `ageYears`, `dominantInterest`. Esse filtro é a **última linha de defesa** — mesmo com consent, criança não recebe conteúdo clínico via IA.

### 4. Testes (`src/modules/ai/context/__tests__/consent.test.ts` — vitest)

- `hasConsent retorna false quando não há registro` — mock supabase respondendo `data: null`; espera `false`.
- `hasConsent retorna true quando há registro ativo` — mock respondendo linha com `granted=true, revoked_at=null`.
- `hasConsent retorna false quando registro está revogado` — mock respondendo `data: null` (query filtra `revoked_at is null`).
- `buildContext sem consents omite campos sensíveis` — mock supabase: children retorna linha completa, consent bulk retorna set vazio → `childProfile` é `undefined`.
- `buildContext respeita revogação` — primeira chamada com consent set completo devolve `diagnoses`; segunda chamada (mesmo builder, novo supabase mock com consent removido) devolve `childProfile` sem `diagnoses`. Garante que nenhum cache in-memory persiste entre calls.
- `serializeContext em persona child omite campos clínicos` — bundle com `diagnoses`/`activeMedications`; saída não contém essas strings.

## Fora do escopo (explícito)

- Não altero RLS de `children`, `medications`, `assessments` nem de `consent_records`.
- Não altero `PersonaConfig`, `PersonaId`, contrato exportado de `ContextBundle`/`serializeContext`.
- Não altero call sites de `buildContext` que hoje não passam `supabase` — eles continuam recebendo bundle sem `childProfile` (comportamento atual).
- Sem UI de gestão de consent nesta task — apenas backend/gate.

## Entregável final antes do commit

Após implementar, envio o diff completo de `consent.ts` e `builder.ts` para revisão antes de qualquer outra mudança.
