
# ATLAS — Ciclo 1: Fundação + Módulo Família

Plataforma para desenvolvimento infantil e acompanhamento neurodivergente. Este ciclo entrega uma base arquitetural definitiva + o Módulo Família funcional, com IA integrada e infra pronta para os módulos Criança, Profissionais, Escola, Comunidade e Marketplace.

## Escopo do ciclo

**Entra:** Fundação (design system, i18n, auth, RLS, camadas), Módulo Família completo, IA (chat + resumos + geração de histórias), PWA offline básico.
**Não entra (mas fica preparado):** Módulo Criança (mundo/avatar/jogos), Profissionais, Comunidade, Marketplace, Escola. Estruturas de pastas, tipos e permissões já nascem prevendo-os.

## Fundação arquitetural

**Stack:** TanStack Start + React 19 + TS strict + Tailwind v4 + shadcn/ui + Lovable Cloud (Supabase) + Lovable AI Gateway.

**Estrutura modular** (`src/modules/<nome>/{components,hooks,services,repositories,schemas,types}`) — nenhuma regra de negócio em componentes. Módulos previstos vazios/stub: `child`, `professional`, `school`, `community`, `marketplace`, `games`, `stories`, `admin`.

**Design System próprio** sobre shadcn: tokens semânticos em `styles.css` (oklch), variantes acolhedoras (paleta calma verde-água/coral/areia, tipografia Nunito+Inter — sem roxo genérico de IA), componentes base padronizados. Modo claro/escuro + alto contraste + fonte ampliada.

**i18n desde o dia 1:** `react-i18next` com namespaces por módulo. Nada de texto hardcoded — lint bloqueia. `pt-BR` como fonte, estrutura pronta para `en`, `es`, `fr`, `it`, `de`.

**Acessibilidade WCAG AA:** navegação por teclado, aria correto, foco visível, `h-dvh`, tap targets ≥44px, `<main>` único por rota.

## Autenticação e permissões

- Lovable Cloud Auth: **Email/senha** + **Apple** (Google fica na config para depois se quiser).
- **Criança NÃO tem login próprio** — entra via PIN de 4 dígitos dentro do device dos pais (perfil-filho derivado da sessão do responsável). LGPD-friendly, sem dados de menor em auth.users.
- Sistema de papéis via tabela `user_roles` separada + função `has_role()` SECURITY DEFINER (evita escalação).
- Papéis-família: `family_admin`, `guardian`, `caregiver`, `viewer`. Estrutura preparada para `professional`, `school_staff`, `admin_platform`.
- Rotas protegidas via `_authenticated/` (layout gerido pela integração Supabase).

## Modelo de dados (Módulo Família — ciclo 1)

Cada tabela: RLS ativado + GRANTs explícitos + policies escopadas por `auth.uid()` via `family_members`.

- `families` — unidade familiar (owner)
- `family_members` — vínculo user↔família + role
- `children` — perfil completo (nome, foto, nascimento, diagnóstico, CID, nível suporte, interesses, hiper/hipossensibilidades, alergias, escola, convênio, contatos emergência)
- `child_professionals` — vínculo profissional↔criança (para módulo futuro)
- `timeline_events` — evento único polimórfico (categoria, tipo, payload jsonb, tags, anexos) — alimentado por TODAS as outras entidades via trigger
- `routines` + `routine_steps` — rotina com imagens, cor, horário, checklist
- `calendar_events` — eventos com recorrência (rrule)
- `medications` + `medication_logs` — cadastro + confirmações de administração
- `documents` — Storage bucket privado + metadata + categoria
- `mood_entries` — humor criança/responsável (escala + emoji + nota)
- `behavior_events` — ocorrências (intensidade, duração, gatilhos, local)
- `goals` + `goal_progress` — metas com evolução
- `reports` — relatórios gerados (semanal/mensal automáticos via cron)
- `notifications` — central unificada
- `ai_conversations` + `ai_messages` — histórico IA
- `audit_logs` — LGPD (quem viu/alterou o quê)
- `consent_records` — consentimentos LGPD versionados

**Storage buckets:** `documents` (privado), `child-avatars` (privado), `family-media` (privado).

## Funcionalidades — Módulo Família

1. **Onboarding** — criar família, adicionar 1ª criança, consentimento LGPD explícito, tour rápido.
2. **Dashboard inteligente** — saudação, próximos eventos, medicações do dia, humor recente, resumo IA da semana, pendências, sugestões. Sem excesso de cards.
3. **Perfil da criança** — todos os campos listados no brief, edição por seções.
4. **Timeline** — feed cronológico agregando tudo, filtros por categoria/criança, anexos, tags.
5. **Calendário** — visões dia/semana/mês/agenda, recorrência, categorias coloridas.
6. **Rotinas** — templates + custom, checklist visual, lembretes.
7. **Medicação** — cadastro, alertas, confirmação, histórico, gráfico de aderência.
8. **Documentos** — upload PDF/imagem/vídeo/áudio, categorização automática (IA classifica), busca full-text.
9. **Humor** — registro rápido diário, gráfico de padrões.
10. **Comportamento** — registro estruturado de ocorrências com contexto.
11. **Objetivos/Metas** — CRUD + progresso + gráfico.
12. **Relatórios** — geração automática (edge cron) semanal/mensal, exportação PDF.
13. **Notificações** — central + push (PWA) + preferências granulares.
14. **Configurações** — perfil, idioma, tema, privacidade, exportar dados (LGPD), excluir conta (LGPD).
15. **Gestão de membros** — convidar responsáveis, atribuir papéis.

## Inteligência Artificial (integrada, não bolt-on)

Via **Lovable AI Gateway** + AI SDK, tudo em `createServerFn` (chave nunca no cliente).

- **Chat IA da Família** ("Atlas") — conversacional, threaded, com contexto real (últimos eventos, humor, medicações, metas da criança selecionada). Modelo: `google/gemini-3.5-flash` para chat rotineiro, `google/gemini-3.1-pro-preview` para relatórios profundos.
- **Resumos automáticos** — semana/mês, detecção de padrões (sono, humor, comportamento).
- **Gerador de histórias sociais personalizadas** — usa nome/idade/interesses/objetivo (ex: "primeira ida ao dentista"). Structured output.
- **Classificação de documentos** ao fazer upload.
- **Sugestões de rotina** contextuais.
- **Disclaimer permanente:** IA é apoio, nunca substitui profissional.

## Segurança & LGPD (não-negociável)

- RLS em 100% das tabelas, escopada por vínculo familiar.
- `audit_logs` para acessos a dados sensíveis de menor.
- Consentimento LGPD versionado + revogável.
- Exportação de dados (JSON completo) + exclusão de conta em cascade.
- Zod validando toda entrada (client + server).
- Rate limit em endpoints de IA e auth.
- Storage buckets privados; URLs assinadas temporárias.
- Nenhum dado sensível em analytics/logs.

## Performance & Escala

- TanStack Query com `ensureQueryData` nos loaders + `useSuspenseQuery`.
- Code splitting por rota (nativo TanStack).
- Lazy load de módulos pesados (calendário, gráficos, IA chat).
- Índices em todas as FKs + colunas de filtro (`child_id`, `family_id`, `created_at`, `category`).
- Imagens: `<img>` com aspect-ratio, futuras via Storage transforms.
- PWA: manifest + service worker (via `vite-plugin-pwa`) para offline básico (dashboard, rotina do dia, medicação de hoje).

## Rotas (TanStack file-based)

```
/                                 → landing pública (marketing curto + CTA)
/auth                             → login/signup
/_authenticated/app               → dashboard família
/_authenticated/crianca/$childId  → perfil criança
/_authenticated/timeline
/_authenticated/calendario
/_authenticated/rotinas
/_authenticated/medicacao
/_authenticated/documentos
/_authenticated/humor
/_authenticated/comportamento
/_authenticated/objetivos
/_authenticated/relatorios
/_authenticated/ia                → chat IA (threads)
/_authenticated/ia/$threadId
/_authenticated/notificacoes
/_authenticated/configuracoes/*
```

## Ordem de implementação (dentro do ciclo)

1. Ativar Lovable Cloud + LOVABLE_API_KEY + configurar Apple auth.
2. Fundação: design system, i18n, layouts, auth pages, gate `_authenticated`, `user_roles`.
3. Schema completo + RLS + GRANTs + triggers de timeline (migração única).
4. Perfil criança + gestão de família/membros + onboarding.
5. Timeline + Calendário + Rotinas.
6. Medicação + Documentos (Storage) + Humor + Comportamento + Metas.
7. Dashboard agregador.
8. Notificações + Configurações + Exportação LGPD.
9. IA: chat threaded + resumos + gerador de histórias + classificação de docs.
10. Relatórios automáticos (cron via pg_cron → server route `/api/public/cron/*`).
11. PWA offline + polimento a11y + testes E2E dos fluxos críticos.

## Detalhes técnicos-chave

- **Timeline unificada:** trigger PL/pgSQL em cada tabela relevante insere em `timeline_events` — nenhum código app duplica registros.
- **Cron:** `pg_cron` chama `/api/public/cron/*` com secret HMAC para geração de relatórios e checagem de lembretes.
- **Push notifications:** Web Push via service worker dedicado (após MVP funcional).
- **Realtime:** Supabase Realtime nas tabelas de notificações e timeline para atualizações vivas entre membros da família.
- **Testes:** Playwright para fluxos críticos (signup → criar criança → registrar humor → ver na timeline).

## O que fica explicitamente fora deste ciclo

Módulo Criança (mundo/avatar/jogos/histórias interativas), Profissionais, Escola, Comunidade, Marketplace, Direitos/Benefícios, integração Google/Apple Calendar, voz/áudio da IA, Capacitor nativo. Todos com pasta/tipos reservados.

---

**Confirma este escopo?** Ao aprovar, começo pela ativação da Cloud + fundação + schema. É um ciclo grande — vou executar em ondas e reportar progresso.
