# Ciclo 2 — Módulo Profissionais

Plataforma colaborativa para profissionais do desenvolvimento infantil. Experiência **completamente separada** da Família e do Admin — layout próprio, navegação própria, tom próprio (organização, rapidez, credibilidade, produtividade, segurança).

> **Pré-requisito:** este módulo depende de persistência real (agenda, sessões, evoluções, mensagens, RLS cruzada entre profissional↔família↔escola). Vou preparar toda a UI, tipos, schemas Zod e IA já neste ciclo, mas **as tabelas e RLS só entram quando o Lovable Cloud for reativado** (workspace hoje sem saldo). Enquanto isso o subtree roda em modo prévia, igual ao Família.

---

## Arquitetura

- Novo módulo isolado em `src/modules/professional/` (`components/`, `hooks/`, `services/`, `repositories/`, `schemas/`, `types/`).
- Novo subtree de rotas `/pro/*` com layout, sidebar e tema próprios — **zero reuso de telas de `/app/*`**.
- Namespace i18n dedicado: `src/locales/pt-BR/pro.json` (nenhum texto hardcoded).
- Tokens visuais: mesma base do design system ATLAS, mas variante "clínica" (mais densa, tipografia Inter dominante, acentos em azul-petróleo para credibilidade, tabelas compactas, atalhos de teclado).
- Novo papel `professional` em `user_roles` + subroles por especialidade em tabela flexível (`professional_specialties`) — nunca enum fixo.
- Vínculo profissional↔criança via `child_professionals` (já reservado no ciclo 1) com escopo de permissão (`view`, `session_write`, `report_write`, `message`).
- IA reusa `src/lib/ai-gateway.server.ts` com prompts/tools distintos ("Atlas Clínico").

## Rotas (`/pro/*`)

```
/pro                       → dashboard profissional
/pro/agenda                → agenda dia/semana/mês/lista
/pro/pacientes             → lista de crianças autorizadas
/pro/pacientes/$childId    → perfil clínico (abas: visão, sessões, evolução, objetivos, escalas, relatórios, docs, escola, família)
/pro/sessoes/nova
/pro/sessoes/$id           → registro/edição de sessão
/pro/evolucao              → feed global filtrável
/pro/objetivos             → metas compartilhadas
/pro/escalas               → instrumentos + aplicações
/pro/relatorios            → geração + biblioteca
/pro/documentos            → biblioteca compartilhada
/pro/mensagens             → threads (por criança) família/escola/profissionais
/pro/escola                → área de troca com escolas
/pro/indicadores           → gráficos agregados
/pro/ia                    → assistente clínico
/pro/configuracoes/*       → perfil profissional, especialidades, disponibilidade, integrações
```

Todas passam a viver sob `_authenticated/pro/*` quando o Cloud voltar; agora ficam abertas com banner de prévia.

## Modelo de dados (a criar quando Cloud ativar)

Cada tabela: RLS + GRANTs + policies escopadas por `has_role('professional')` **e** vínculo em `child_professionals`.

- `professionals` — perfil (registro conselho, especialidades[], bio, foto, disponibilidade)
- `professional_specialties` — catálogo aberto (seed com a lista do brief, mas extensível)
- `child_professionals` — vínculo + escopo de permissão
- `appointments` — agenda (start, end, child_id, professional_id, status, local, modalidade, recorrência)
- `sessions` — atendimento realizado (duração, objetivos aplicados, atividades, materiais, resposta, observações, próximos passos)
- `session_attachments` — foto/vídeo/áudio/arquivo (Storage privado)
- `evolution_entries` — evolução cronológica (texto + anexos + escalas aplicadas + indicadores)
- `evolution_shares` — com quem foi compartilhada (família/escola/outros profissionais)
- `therapeutic_goals` — metas compartilhadas (categoria, prazo, responsável, participantes, %)
- `goal_indicators` + `goal_measurements` — indicadores quantitativos por meta
- `scales` — catálogo flexível de instrumentos (estrutura jsonb de itens/pontuação)
- `scale_applications` — aplicações + resultado
- `professional_reports` — relatórios (tipo: sessão/semanal/mensal/trimestral/anual/custom, status, arquivo)
- `messages` + `message_threads` — comunicação segura por criança
- `school_links` + `school_shares` — integração escolar
- `professional_documents` — biblioteca (versionamento via `document_versions`)
- `ai_professional_conversations` + mensagens (thread separada da IA da família)

Triggers: toda escrita relevante gera `timeline_events` (unificando família ↔ profissional) — reaproveita infra do ciclo 1.

## Funcionalidades por onda

**Onda 1 — Fundação do módulo (executa já, sem Cloud)**
- Layout `/pro` com sidebar clínica própria, header com busca global, atalhos de teclado (`g p` pacientes, `g a` agenda, `n s` nova sessão), command palette (⌘K).
- Design tokens "clínicos" adicionais em `styles.css` (variante `.pro`).
- i18n `pro.json` (pt-BR) com todos os labels.
- Todas as 15+ rotas com placeholders bem trabalhados (não genéricos): mostram estrutura real da tela, campos, colunas de tabela, filtros — mas sem dados.
- Tipos TS completos em `src/modules/professional/types/` refletindo o schema futuro.
- Schemas Zod prontos em `schemas/` para validação client+server.
- Repositórios stubados (`repositories/*.ts`) com interface pronta — trocar implementação mock por Supabase é 1 linha por método quando o Cloud voltar.

**Onda 2 — Perfil clínico + Sessões + Evolução (após Cloud)**
- Migração completa das tabelas acima com RLS + GRANTs + triggers.
- Perfil da criança em abas, com **reuso automático** de dados já registrados pela família (nunca pedir duas vezes).
- Fluxo de nova sessão: pré-preenche objetivos ativos + últimas observações + escalas pendentes.
- Anexos via Storage bucket privado `pro-session-media` com URLs assinadas.
- Feed de evolução com filtros e compartilhamento granular.

**Onda 3 — Agenda + Objetivos + Escalas + Indicadores**
- Agenda dia/semana/mês/lista com recorrência (rrule) e detecção de conflito.
- Objetivos terapêuticos compartilhados com progresso automático a partir de sessões/escalas.
- Motor genérico de escalas (schema jsonb `{items, scoring, ranges}`) — cadastro de qualquer instrumento sem alterar código.
- Indicadores: gráficos Recharts sobre evolução, humor, comportamento, sono, medicação, participação, frequência.

**Onda 4 — Relatórios + Mensagens + Escola + Documentos**
- Geração de relatórios (sessão/semanal/mensal/trimestral/anual/custom) via server function + IA para redação assistida + export PDF/DOCX (skill `docx`).
- Threads de mensagens por criança (família/escola/profissionais), realtime, anexos.
- Área Escola com compartilhamento controlado por consentimento explícito.
- Biblioteca de documentos com versionamento.

**Onda 5 — IA Clínica + Integrações + Polimento**
- Assistente "Atlas Clínico" (thread separada): resumir evolução, comparar períodos, achar padrões, gerar hipóteses, sugerir atividades, rascunhar relatório. Prompt system deixa explícito: **nunca diagnostica, nunca substitui decisão clínica**.
- Preparação para Google/Apple/Outlook Calendar (OAuth via connector — só liga quando pedido).
- Testes Playwright dos fluxos críticos (nova sessão → evolução → relatório → compartilhar com família).

## Segurança & LGPD

- RLS obriga vínculo em `child_professionals` com escopo apropriado — profissional **jamais** vê criança não autorizada.
- Toda leitura de dado sensível de menor por profissional gera `audit_logs`.
- Compartilhamento (evolução/relatório/escola) exige consentimento versionado em `consent_records`.
- Storage buckets privados; URLs assinadas curtas.
- IA nunca recebe PII sem necessidade — prompts recebem contexto mínimo e anonimizado quando possível.

## O que fica fora deste ciclo

Faturamento/recibos, integração real com convênios, telemedicina (vídeo nativo), app Capacitor, marketplace de profissionais. Estrutura de pastas fica reservada.

---

## Detalhes técnicos (para o time)

- Nova rota-mãe `src/routes/pro.tsx` com `ProShell` isolado; sub-rotas via convenção plana (`pro.agenda.tsx`, `pro.pacientes.$childId.tsx` etc.).
- `ProShell` **não** importa nada de `src/components/atlas/app-shell.tsx` — separação total.
- Variante de tema aplicada via classe `.pro` no `<body>` quando dentro de `/pro/*` (adiciona overrides de densidade/cor no `styles.css`).
- Command palette com `cmdk` (adicionar dep na onda 1).
- Todos os textos via `useTranslation("pro")`.
- Repositórios seguem interface: componente importa `useSessionsRepository()` — hoje retorna mock em memória, amanhã retorna implementação Supabase, sem tocar em componente.
- Quando Cloud voltar: migração única com todas as tabelas + policies + GRANTs + seeds do catálogo de especialidades e escalas iniciais; subtree migra para `_authenticated/pro/*`.

**Confirma este escopo e a execução em ondas (Onda 1 já, resto conforme Cloud voltar)?**
