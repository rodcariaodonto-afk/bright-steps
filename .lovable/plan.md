
# Reestruturação da Landing: foco em conversão e transformação

Vou reorganizar a ordem das seções da landing, trocar copies e adicionar 1 nova seção (Antes/Depois), reaproveitando 100% dos componentes visuais já existentes (cards, botões, tipografia, cores, motion). Toda a mudança de texto passa por `src/locales/pt-BR/landing.json` e depois é propagada para os 14 idiomas restantes via `scripts/i18n-translate.ts`.

## Nova ordem de seções em `src/routes/index.tsx`

1. Hero (mantido)
2. Dor da Família (`empathy` atual, mantido)
3. Nova forma de pensar (substitui a antiga seção "Tudo conversa entre si" / bloco de destaque atual) → nova chave `flow`
4. Funcionalidades (a atual "Um ecossistema" vai virar `modules` reescrito, com 4 bullets de benefício)
5. IA (mantida, copy trocada + novo exemplo de chat com Bento/consulta odontológica)
6. Segurança (mantida, só o título/subtítulo mudam)
7. Dados / Conscientização (mantido, só título/subtítulo mudam)
8. Antes x Depois (NOVA seção `beforeAfter` com 3 cards e CTA)
9. CTA final (copy substituída + microcopy de reforço "sem cartão, LGPD, poucos minutos")

Section id `#pilares` fica no bloco 3 (nova forma de pensar) para preservar o link do nav; `#modulos`, `#ia`, `#seguranca` continuam válidos.

## Alterações em `src/routes/index.tsx`

- Reordenar os JSX blocks para a sequência acima.
- Substituir a seção atual pós-empathy (linhas ~218-242) pelo novo bloco `flow`:
  - Título + subtítulo
  - 4 cards horizontais com seta ↓ entre eles em mobile, com ícones já disponíveis (`Users`, `Network`, `Sparkles`, `HeartHandshake` ou similar do lucide já importados).
  - Destaque verde (mesma casca do `empathy.highlight` — `rounded-3xl bg-primary-soft`) com título, texto de 3 linhas e CTA "Conhecer o Meu Mundo Azul".
- Reescrever a seção `modules`: manter o mesmo grid, trocar o título/subtítulo e reduzir a lista para os 4 benefícios ("Família organizada", "Criança engajada", "Profissionais conectados", "IA que acompanha a evolução"), cada um com um subtexto curto (usar variant de card com título + descrição em vez de string plana; ajustar o `map` para o novo shape).
- Seção IA: substituir o exemplo de chat dentro de `AIChatPreview` para a conversa Família/Azul sobre a consulta odontológica do Bento (via novas chaves `aiChat.userMessage` / `aiChat.aiMessage`). Manter disclaimer.
- Adicionar nova seção `beforeAfter` antes do CTA final: 3 cards com colunas "Antes" (lista) / "Depois" (frase), separador visual, e botão "Criar minha conta gratuitamente" apontando para `/auth`.
- CTA final: nova copy + microcopy de 3 itens abaixo do botão.
- Ajuste geral: garantir que qualquer referência a medicamento específico no `HeroPreview` (row2/row3 subtitles) esteja como "Medicação / Confirmar administração" nas strings do `landing.json` (já foi feito antes, revalidar).

## Alterações em `src/locales/pt-BR/landing.json`

- Remover: chaves antigas de conexão entre módulos que não serão usadas.
- Manter: `hero`, `heroPreview`, `empathy`, `nav`, `footer`, `security.items`, `awareness.stats`, `awareness.sources`, `ai.bullets`, `ai.disclaimer`, `ai.eyebrow`.
- Substituir textos: `ai.title`, `ai.description`, `security.title`, `security.subtitle` (nova), `awareness.title`, `awareness.subtitle`, `cta.title`, `cta.subtitle`, `cta.action`, `cta.microcopy` (novo array de 3 itens).
- Reescrever `modules.title`, `modules.subtitle`, e transformar `modules.items` de `string[]` para `{ title, description }[]` com 4 itens de benefício. Ajustar o consumo em `index.tsx`.
- Adicionar bloco novo `flow`: `{ title, description, steps: [{title, description}]×4, highlight: {title, lines[3], cta} }`.
- Adicionar bloco novo `aiChat`: `{ userMessage, aiMessage }`.
- Adicionar bloco novo `beforeAfter`: `{ title, cards: [{ before: string|string[], after: string }]×3, cta }`.

## Propagação i18n

- Rodar `bun run scripts/i18n-translate.ts` para os 14 locales (`en, es, fr, it, de, nl, pl, tr, ru, ja, ko, zh-CN, zh-TW, ar`) atualizando somente as chaves novas/alteradas.
- Validar JSON de cada locale (parse + presença das chaves-chave: `flow.title`, `modules.items[0].title`, `beforeAfter.cta`, `cta.microcopy[0]`).
- Se algum locale truncar (padrão observado em EN/PL/TR/ZH-CN), aumentar `max_tokens` temporariamente ou completar as chaves faltantes manualmente, como feito nas ondas anteriores.

## Fora de escopo (preservado)

- Identidade visual, tokens de cor, tipografia, `AtlasLogo`, `LocaleSelector`, `Button`, container `container-atlas`, grids e responsividade atuais.
- Meta tags SEO da rota `/`.
- Nav (`#pilares`, `#modulos`, `#ia`, `#seguranca`, `/planos`, `/auth`).
- Nenhuma mudança em rotas backend, RLS, i18n runtime, ou paywall.

## Verificação final

- `bunx tsgo` para checar tipos após mudar o shape de `modules.items`.
- Abrir `/` no preview em `pt-BR` e `en` via Playwright, capturar screenshot da página inteira em desktop 1280 e mobile 390, confirmar ordem das 9 seções e ausência de referências a medicamento específico.
