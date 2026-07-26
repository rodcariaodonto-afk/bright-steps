Escopo

Rewrite completo da copy do Hero da landing + dois ajustes no mockup (linha de medicação + card da IA). Sem tocar em layout, cores, tipografia, componentes, grid, responsividade ou seções abaixo do Hero.

## Arquivos

**1. `src/locales/pt-BR/landing.json**` (fonte de verdade PT-BR)

Substituir os valores das chaves existentes (sem renomear chaves, para não mexer no `index.tsx`):

- `hero.eyebrow` → `Neurodesenvolvimento • IA • Família • Escola • Profissionais`
- `hero.title` → `Chega de contar a história do seu filho do zero em toda consulta.`
- `hero.subtitle` → `O Meu Mundo Azul conecta família, terapeutas e escola em um único lugar. Toda informação importante acompanha a criança, permitindo um cuidado mais organizado, contínuo e inteligente.`
- `hero.primaryCta` → `Criar minha conta gratuitamente`
- `hero.secondaryCta` → `Ver como funciona`
- `hero.trust` → `Criado com famílias, terapeutas e especialistas em neurodesenvolvimento.`
- `heroPreview.row2Title` → `Medicação`
- `heroPreview.row2Subtitle` → `Confirmar administração` (já é isso; manter)
- `heroPreview.aiMessage` (o card lateral do mockup do dia) → `Percebi que o Bento dormiu melhor nos últimos cinco dias. Manter a rotina das 20h30 pode ajudar a preservar essa evolução.`

O card grande "Azul IA" da seção IA (mais abaixo) fica intacto, é fora do Hero. O `aiLabel` do Hero já é "Azul IA".

**2. Demais 14 locales** (`ar, de, en, es, fr, it, ja, ko, nl, pl, ru, tr, zh-CN, zh-TW`)

Regenerar apenas essas 6 chaves de `hero.*` + `heroPreview.row2Title` + `heroPreview.aiMessage` via `scripts/i18n-translate.ts` (mesmo pipeline Gemini já usado no projeto). `row2Subtitle` continua como está em cada locale (equivalente de "Confirmar administração").

Se o script não suporta target-por-chave, alternativa: rodar o script sobre `landing.json` inteiro, tratando PT-BR como fonte — vai apenas atualizar campos que mudaram. Confirmo essa capacidade antes de rodar; se não existir, faço as 6 chaves manualmente por locale.

## Não altero

- Nenhum outro texto/seção da landing.
- `index.tsx` (nenhuma chave renomeada, então JSX permanece).
- Cores, gradientes, motion, layout de duas colunas, `HeroPreview` estrutural.
- `AIChatPreview` da seção IA (fora do Hero, fora do pedido).
- `webhook.ts`, rotas, backend.

## Validação

- Abrir `/` em PT-BR: novo hero e mockup atualizados.
- Trocar locale para EN/ES: hero traduzido, mockup com "Medicação"/"aiMessage" traduzidos.
- Sem quebra de build (só JSONs mudam).  
OBSERVAÇÃ0: NAO MUDAR NADA NO i18N, cada usuario de um pais que acessar, ele precisa ver a pagina e toda a plataforma na lingua nativa dele.