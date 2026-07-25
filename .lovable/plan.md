# Localização de Histórias e Jogos

Hoje `content_stories` e `content_games` armazenam título, descrição, textos das páginas/nós e rótulos de escolhas em **um único idioma** (PT-BR, cadastrado pelo admin). O sistema i18n só cobre a "casca" da UI, não o conteúdo dinâmico do banco. Resultado: mesmo com o app em inglês, o admin vê "Era uma vez..." em português.

A solução escolhida: **traduzir automaticamente para o idioma ativo da sessão**, com cache no banco para não pagar IA duas vezes pelo mesmo conteúdo.

## Como vai funcionar (visão do usuário)

- Admin continua cadastrando **uma única vez**, no idioma dele (PT-BR default).
- Quando a criança/família abre uma história ou jogo:
  1. O app pede o conteúdo já no idioma ativo (`en`, `es`, `fr`...).
  2. Se já existe tradução em cache → retorna instantâneo.
  3. Se não existe → chama a IA (Gemini via Lovable AI Gateway), traduz, salva no cache e retorna. Latência ~2-4s só na primeira vez de cada idioma.
- Admin ganha um botão "Traduzir agora para todos os idiomas" no editor, para pré-aquecer o cache antes do lançamento (opcional).
- Admin também pode **editar manualmente** qualquer tradução gerada (override), útil para termos técnicos ou culturais.

## Arquitetura técnica

### 1. Schema (nova migração)

Nova tabela genérica `content_translations` (serve para histórias, jogos e qualquer conteúdo futuro):

```text
content_translations
├── id uuid pk
├── entity_type text        ('story' | 'game')
├── entity_id uuid          (fk lógico → content_stories.id / content_games.id)
├── locale text             ('en', 'es', 'fr', 'ar', ...)
├── source_locale text      ('pt-BR' — origem da tradução)
├── source_hash text        (hash do conteúdo original; invalida cache se admin editar)
├── payload jsonb           ({ title, summary/description, config })
├── status text             ('auto' | 'reviewed' | 'manual')
├── created_at, updated_at
└── unique(entity_type, entity_id, locale)
```

- **`source_hash`** permite invalidação automática: se o admin editar o texto original em PT, traduções ficam marcadas como "stale" e são regeneradas na próxima leitura.
- **`status='manual'`** protege overrides do admin de serem sobrescritos por regeneração automática.
- RLS: `SELECT` liberado para `authenticated` (todos leem traduções publicadas); `INSERT/UPDATE/DELETE` só para admin ou via server function (SECURITY DEFINER).

### 2. Server function de tradução

`src/lib/content-translation.functions.ts`:

- `getTranslatedContent({ entityType, entityId, locale })` — endpoint público (leitura):
  1. Se `locale === source_locale` do registro → retorna original.
  2. Busca `content_translations` para `(entityType, entityId, locale)`.
  3. Se existe e `source_hash` bate → retorna cache.
  4. Se não existe ou stale → chama IA, salva, retorna.
- `translateContentBatch({ entityType, entityId, locales? })` — admin only, pré-aquece cache.
- `saveManualTranslation(...)` — admin edita tradução específica (marca `status='manual'`).

Prompt da IA: enviamos JSON estruturado (title, summary, e o `config` completo do jogo/história) e pedimos para preservar chaves e estrutura, traduzindo apenas valores de texto. Modelo padrão: `google/gemini-2.5-flash` (rápido e barato).

### 3. Integração no rendering

- **Kid — Histórias** (`src/routes/kid.historias.tsx`, `src/modules/stories/runtime/story-player.tsx`):
  troca `story.title/summary/config` pelos campos vindos de `getTranslatedContent()` usando o locale do `useLocale()`.
- **Kid — Jogos** (`src/routes/kid.jogos.tsx`, `src/modules/games/runtime/game-player.tsx`): mesma coisa para `game.title/description/config`.
- **Listagens** (galerias de história/jogos): server function `listPublishedContent({ entityType, locale })` já faz o join e devolve tudo pronto no idioma; traduções faltantes caem em background (retornam original + dispara translate assíncrono).

### 4. Admin CMS

- Adiciona seção "Traduções" no editor de história/jogo:
  - Grid mostrando status por idioma (pendente / cache / manual).
  - Botão "Gerar traduções faltantes" (chama `translateContentBatch`).
  - Botão por idioma para editar override manual.
- Textos hardcoded em português nas telas admin já estão fora deste escopo (a UI admin ainda não passa por i18next — assunto separado).

### 5. Fallback

Se a IA falhar (rate limit, timeout), o app cai no idioma original com um aviso discreto (`toast`), não quebra a experiência.

## Custos e performance

- Cache-hit é grátis (só leitura do Postgres).
- Cache-miss: 1 chamada Gemini Flash por (conteúdo × idioma). Uma história média cabe em ~500 tokens → custo desprezível.
- 15 idiomas × N conteúdos = no máximo N×15 chamadas na vida toda de cada conteúdo (a menos que o admin edite).

## Escopo desta implementação

Incluído:
1. Migração `content_translations` + RLS + grants.
2. Server functions: `getTranslatedContent`, `translateContentBatch`, `saveManualTranslation`, `listPublishedContent`.
3. Hook `useTranslatedContent(entityType, entityId)` que já resolve locale.
4. Refatoração de `kid.historias.tsx`, `kid.jogos.tsx`, `story-player.tsx`, `game-player.tsx` para consumir via hook.
5. Aba "Traduções" no editor admin de história e jogo.
6. Job assíncrono (fire-and-forget) para gerar tradução em background quando cache-miss numa listagem.

Fora do escopo (fica para depois se você quiser):
- Traduzir a UI hardcoded em PT dos painéis admin.
- Traduzir `game_engines.description` e labels internos de engines (afetam poucos usuários — só admin).
- Traduzir library_articles e content_missions (mesma arquitetura, replicável em ~30min quando pedir).