## Objetivo

Trocar a seção "pillars" (Um ecossistema, muitas vidas) por uma nova seção emocional "empathy" que gera identificação com a dor da família antes de apresentar a solução. Sem mudar identidade visual, largura, tipografia, espaçamento, cards ou responsividade.

## Mudanças

### 1. Copy (i18n)

`src/locales/pt-BR/landing.json`
- Remover o bloco `pillars` inteiro.
- Adicionar novo bloco `empathy` com:
  - `title`: "Você cuida do seu filho. Mas quem cuida das informações dele?"
  - `subtitle`: parágrafo com dois blocos (dor + convite à centralização).
  - `items` (array de 4): título e descrição conforme especificado (mesma história / informações espalhadas / cada profissional vê uma parte / família vira central).
  - `highlight.title`: "O Meu Mundo Azul muda essa realidade."
  - `highlight.description`: texto do bloco verde.
  - `highlight.cta`: "Conheça como funciona"

Depois, deletar as chaves `pillars` correspondentes nos outros 14 locales e rodar `scripts/i18n-translate.ts` com `ONLY_NS=landing` para gerar `empathy` traduzido em todos.

### 2. Componente

`src/routes/index.tsx`
- Remover leitura de `pillars.items` e o `<section id="pilares">` inteiro (linhas 154-187 aprox.), mais o array `pillarIcons` que só serve à seção antiga.
- Inserir no mesmo lugar uma nova `<section id="empathy">` com a mesma casca visual dos pilares:
  - Container `container-atlas`, header `max-w-2xl` (h2 4xl bold + subtítulo `text-lg text-muted-foreground`, respeitando quebras de parágrafo do subtítulo).
  - Grid `mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4` com 4 cards no mesmo estilo (`rounded-3xl border bg-card p-6 shadow-sm`, ícone em `bg-primary-soft text-primary`, título `text-lg font-semibold`, descrição `text-sm text-muted-foreground`) preservando as animações `motion.div`.
  - Ícones lucide: `MessagesSquare` (conversa), `Files` (documentos), `Network` (conexão), `Users` (família).
- Abaixo do grid, um bloco de destaque:
  - Card `rounded-3xl` com fundo verde suave usando o token existente `bg-primary-soft` (mesma família visual dos badges "primary-soft" do site, mantém identidade).
  - Título forte + parágrafo em `text-muted-foreground` + `Button` primário arredondado (`rounded-full`) linkando para `#modulos` (âncora "Conheça como funciona" leva ao bloco de módulos que já explica o funcionamento).
- Manter o `id="pilares"` como âncora legada? Não. A navbar hoje aponta para `#pilares`; trocar o link do menu para `#empathy` ou renomear o id. Vou verificar antes de aplicar.

### 3. Verificações pós-edição

- Ler o nav da landing (`src/routes/index.tsx` topo) para confirmar qual `href` referencia `#pilares` e atualizar junto (ou manter `id="pilares"` na nova section por compatibilidade — decisão: manter `id="pilares"` para não quebrar o link do menu; label do menu segue "Família").
- Rodar o build automático para checar tipos.
- Validar visualmente no viewport atual (1138×682) que grid vira 2 colunas em md e 4 em lg, e que o bloco verde não estoura a largura do container.

## Detalhes técnicos

- Nenhum token de cor novo. Usar `bg-primary-soft` (já definido em `styles.css`) para o bloco verde de destaque, mantendo o mesmo tom institucional dos badges/ícones existentes.
- Ícones importados de `lucide-react` no topo do arquivo, removendo os imports não mais usados (`Sparkles` etc. só se ficarem órfãos).
- Nenhuma copy usa travessão "—", conforme regra do projeto.
- Tradução automática dos 14 idiomas via script existente (`ONLY_NS=landing`), preservando cache das demais chaves.

## Fora de escopo

- Não altero Hero, Módulos, IA, Segurança, CTA final, nem cores/tokens globais.
- Não mudo o fluxo de rotas nem componentes compartilhados.
