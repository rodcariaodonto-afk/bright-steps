## Problema

O `PatternsCard` (Onda P.3) já está no dashboard `/app` e a IA responde corretamente, mas:

- Fica escondido no final do grid, abaixo dos cards mock ("Sem agendamentos", "A Azul IA está pronta").
- Usa o mesmo ícone `Sparkles` e a mesma paleta primária do bloco "A Azul IA está pronta" → o usuário confunde os dois.
- Como Enzo ainda não tem 5 registros somados de humor + comportamento + medicação, o corpo mostra só uma frase discreta e parece "nada aconteceu".

## Objetivo

Deixar claro no dashboard família o que é o card de padrões, onde ele está, e o que fazer quando ainda não há dados.

## Mudanças (somente UI, sem tocar em API/DB)

### 1. `src/routes/app.index.tsx`
- Mover o `PatternsCard` para o **topo** do grid, logo abaixo do header e antes dos 3 cards de resumo, ocupando largura total (`md:col-span-2 xl:col-span-3`).
- Remover o bloco duplicado "A Azul IA está pronta" (fica redundante agora que o PatternsCard é o card principal de IA); manter apenas o CTA "Conversar com a Azul IA" como botão dentro do próprio `PatternsCard` ou como card menor separado.

### 2. `src/components/insights/patterns-card.tsx`
- Trocar o ícone `Sparkles` por `Brain` (Lucide) só na variante `family` para diferenciar visualmente do bloco de chat IA que usa `Sparkles`.
- Ajustar o rótulo do header: manter "Padrões detectados pela Azul" mas adicionar um subtítulo curto explicando "Análise automática dos últimos 30 dias de humor, comportamento e medicação".
- Melhorar o estado `empty`:
  - Ícone maior + mensagem clara "Registre pelo menos 5 eventos de humor, comportamento ou medicação nos próximos dias para a Azul detectar padrões".
  - Botões atalho: "Registrar humor" → `/app/humor`, "Registrar comportamento" → `/app/comportamento`, "Registrar medicação" → `/app/medicacao`.
- Deixar o botão "Atualizar" mais visível (usar `variant="outline"` em vez de `ghost`).

### 3. Locales `src/locales/pt-BR/app.json`
- Adicionar bloco `insights.emptyCta.*` com os textos dos atalhos e do subtítulo.

## Fora do escopo

- Não mexer em `src/modules/insights/api.functions.ts` nem na tabela `insights_cache`.
- Não alterar o card na variante `pro` (perfil clínico já está adequado).
- Não gerar dados de exemplo automaticamente.

## Verificação

Após o build, abrir `/app` logado como Rodrigo → confirmar que o PatternsCard aparece no topo com o estado "empty" enriquecido e os 3 botões de atalho para registrar dados.
