
# Onda 3 (Pro + Admin) + Fundação Global de i18n/l10n

Rodrigo, esse pedido tem duas partes com tamanhos muito diferentes. A Onda 3 é uma sessão curta; a internacionalização é infraestrutura de plataforma e requer conversa honesta sobre escopo antes de eu prometer coisa que não entrego.

## Parte A — Onda 3: Padronizar shells Pro e Admin

Aplicar o mesmo padrão da Onda 1 aos outros módulos.

1. **ProShell** — sidebar agrupada colapsável:
   - **Clínico**: Painel, Pacientes, Evolução, Objetivos, Sessões
   - **Agenda & escala**: Agenda, Escalas
   - **Documentação**: Documentos, Relatórios, Indicadores
   - **Colaboração**: Escola, Mensagens, IA
   - **Conta**: Perfil, Configurações
   - Drawer mobile via `Sheet`.
   - Adicionar **PatientPicker** (equivalente ao ChildPicker) no topbar, listando pacientes do profissional com atalho pra "Ver ficha".

2. **AdminShell** — sidebar agrupada:
   - **Painel**: Início, Analytics, Relatórios, Logs
   - **Pessoas**: Usuários, Famílias, Crianças, Profissionais, Escolas, Permissões
   - **Conteúdo**: CMS, Biblioteca, Jogos, Histórias, Missões, Conquistas
   - **Comércio**: Assinaturas, Marketplace, Comunidade, Financeiro, Cupons
   - **Sistema**: IA, Notificações, Feature flags, Backups, Configurações
   - Drawer mobile via `Sheet`.

3. **PageHeader** (criado na Onda 2) aplicado nos índices das rotas Pro e Admin.

---

## Parte B — Fundação de i18n/l10n global

### Contexto honesto de escopo

- Hoje só **26 dos ~156 arquivos** usam `useTranslation`. Todo o resto tem strings PT-BR hardcoded (o Admin inteiro, boa parte do Pro, muitas páginas do App).
- Traduzir manualmente **156 arquivos × 15 idiomas** é trabalho de várias semanas e vira ruído pra iterar produto.
- Proposta: **entregar a fundação completa e robusta agora** (detecção automática, RTL, formatação, seletor, persistência, lazy loading, i18n gateway pronto pra IA) + **catálogo PT-BR/EN 100% pronto** + **cascata de fallback + tradução por IA sob demanda** pros outros 13 idiomas, migrando as strings hardcoded em ondas.

### 1. Infraestrutura (`src/i18n/`)

Reorganizar de `src/locales/` para:

```
src/i18n/
  index.ts                 # bootstrap i18next + detector + formatter
  config.ts                # SUPPORTED_LOCALES, RTL_LOCALES, metadados
  detector.ts              # cadeia: user pref → localStorage → navigator → timezone → IP → 'en'
  format.ts                # date/time/number/currency/percent helpers
  rtl.ts                   # aplicação de dir="rtl" no <html>
  translations/
    pt-BR/  {common, landing, auth, app, pro, admin, ai, kid, errors, notifications, billing, settings}.json
    en/     (mesma estrutura, 100% completo)
    es/  fr/  it/  de/  nl/  pl/  tr/  ar/  ja/  ko/  zh-CN/  zh-TW/  ru/
```

- **Lazy loading real**: usar `i18next-http-backend` com resolver Vite `import.meta.glob('./translations/*/*.json')` — só o idioma ativo entra no bundle inicial.
- **Fallback em cascata**: idioma pedido → família (`fr-CA` → `fr`) → `en` → `pt-BR`.
- **Configuração central** com 15 idiomas + `dir`, `dateLocale`, `numberFormat`, `firstDayOfWeek`, `currency` padrão, `measurementSystem`.

### 2. Detecção automática (sem GPS)

Cadeia em `detector.ts`, primeira que resolver ganha:

1. `profile.locale` salvo em `profiles.locale` (backend, sincroniza entre dispositivos).
2. `localStorage['mma:locale']`.
3. `navigator.language` + `navigator.languages` (mapeados pra locale suportado).
4. `Intl.DateTimeFormat().resolvedOptions().timeZone` → mapa timezone→idioma como sinal fraco.
5. **Geo por IP** via server function chamando `ipapi.co` (grátis, sem key, sem GPS) — 1x, cacheada em `sessionStorage`.
6. Fallback `en`.

### 3. Persistência no backend

Migration:
```sql
ALTER TABLE public.profiles ADD COLUMN locale TEXT;
ALTER TABLE public.profiles ADD COLUMN timezone TEXT;
```
- Escrita: seletor de idioma nas Configurações + auto-save após detecção inicial se `profile.locale` for null.
- Leitura: `use-session` expõe `profile.locale`, `i18n` sincroniza no login.

### 4. Suporte RTL

- `RTL_LOCALES = ['ar']`.
- Efeito global: seta `<html dir="rtl" lang="ar">`.
- Usar utilitários lógicos do Tailwind (`ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`) em vez de `ml`/`mr`/`pl`/`pr`. Auditar componentes de shell e substituir onde afeta layout direcional (sidebar, drawer, botões com ícone).
- Ícones direcionais (`ArrowRight`, `ChevronRight`) trocam via helper `<DirectionalIcon>` que espelha em RTL.

### 5. Formatação localizada

Helpers em `format.ts` usando `Intl.*` nativo (zero dependência extra):
- `formatDate(date, locale, opts?)`, `formatTime`, `formatDateTime`, `formatRelative`
- `formatNumber`, `formatCurrency(amount, locale, currency?)`, `formatPercent`
- `firstDayOfWeek(locale)` pra calendário
- Hook `useLocale()` devolve tudo já bound ao idioma ativo.
- Substituir `.toLocaleDateString("pt-BR", …)` espalhados pelo código por esses helpers.

### 6. Seletor de idioma

- Componente `<LocaleSelector />` com bandeira + nome nativo (ex: "Français").
- Colocado em: **Configurações da conta** (persiste no perfil) e no **rodapé da landing** (só sessão).

### 7. Preparação para IA

- `i18n.ai.translate(key, targetLocale)` — server function que, quando uma chave falta em um locale não-PT-BR/EN, chama o AI Gateway (Gemini) pra traduzir a partir do PT-BR e cacheia num JSON gerado por locale.
- Estratégia: PT-BR e EN são "source of truth" mantidos por humanos. Demais idiomas começam via cascata de fallback pra EN e vão sendo preenchidos por IA sob demanda + revisão.

### 8. Migração de strings hardcoded — em ondas

Isso não cabe numa rodada só. Proposta de ordem:

- **Onda i18n-1 (esta rodada)**: shells (App, Pro, Admin, Kid), landing, auth, configurações, seletor de idioma, dashboard família. ~30 arquivos.
- **Onda i18n-2**: módulo App restante (rotinas, medicação, humor, calendário, etc). ~40 arquivos.
- **Onda i18n-3**: módulo Pro completo. ~25 arquivos.
- **Onda i18n-4**: módulo Admin completo. ~30 arquivos.
- **Onda i18n-5**: Kid + comunidade + marketplace. ~20 arquivos.

Cada onda: extrai strings → chaves em `pt-BR/*.json` e `en/*.json` → dispara tradução IA para os 13 restantes → você revisa.

### 9. Documentação

Ao final desta rodada, criar `docs/i18n.md` explicando:
- Estrutura de pastas e convenção de namespaces.
- Como adicionar novo idioma (3 passos: adicionar em `config.ts`, criar pasta, rodar script de tradução IA).
- Como adicionar nova string (chave + PT-BR + EN, resto vem por fallback/IA).
- Regras de RTL, formatação e uso de `useLocale`.
- Fluxo de sincronização com o perfil.

---

## Detalhes técnicos

- **Libs**: mantém `i18next` + `react-i18next` (já instalados) + adiciona `i18next-browser-languagedetector` (já instalado) + `i18next-resources-to-backend` (leve, pra lazy import via Vite glob).
- **Sem quebra**: catálogo antigo `src/locales/` movido pra `src/i18n/translations/`; import alias `@/locales/*` mantido apontando pra novo local via `tsconfig` paths pra não quebrar os 26 arquivos que já usam.
- **Backend**: 1 migration adicionando `locale` e `timezone` em `profiles`, 1 server function `detectLocaleByIP` (chama ipapi.co, sem secret), 1 server function `updateProfileLocale`.
- **Sem GPS**: nunca invoca `navigator.geolocation`.
- **Fonte**: garantir que a Inter/DM Sans em uso tem cobertura de latin-ext + cyrillic + greek. Para árabe/japonês/coreano/chinês, adicionar `Noto Sans Arabic`, `Noto Sans JP`, `Noto Sans KR`, `Noto Sans SC/TC` via `<link>` no `__root.tsx` só quando o idioma ativo pedir (dynamic swap).

## O que fica de fora desta rodada

- Tradução manual de todas as strings hardcoded (vai por ondas).
- Traduções finais revisadas por humano nativo em 13 idiomas (IA gera baseline, revisão humana é etapa posterior).
- Suporte a moedas por país no checkout Stripe (hoje é BRL fixo — precisaria de multi-currency Stripe, é um projeto próprio).
- Tradução de conteúdo dinâmico gerado por usuários (posts, mensagens) — infra pronta mas não implementada.

## Ordem sugerida de execução

1. Onda 3 (Pro + Admin shells) — rápido, 1 sessão.
2. Fundação i18n completa + migração dos shells (Onda i18n-1) — 1 sessão grande.
3. Você valida. Depois seguimos Onda i18n-2 → 3 → 4 → 5 conforme prioridade.

Se aprovar, faço Onda 3 + Fundação i18n + Onda i18n-1 nesta rodada e paro pra você validar antes das ondas de migração restantes.
