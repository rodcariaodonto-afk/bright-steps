
# Auditoria UX/UI — Meu Mundo Azul

Rodrigo, mapeei a plataforma inteira (Família, Pro, Admin, Kid, Landing) e organizei os problemas em 4 ondas, da mais urgente para a mais polida. Cada onda é entregável de forma independente, então dá pra pausar entre uma e outra pra você validar.

## Problemas que encontrei

**Navegação (Família /app)**
- Sidebar com 24 itens numa lista plana, sem agrupamento, sem hierarquia. Difícil escanear.
- Botão "Mundo Azul" espremido na topbar entre ChildPicker e avatar — o próprio ponto que você levantou. Não comunica que é uma mudança de contexto (adulto → criança).
- Menu mobile é um `grid-cols-2` cru com 24 itens, também sem agrupamento.
- ChildPicker aparece duas vezes no DOM (desktop e mobile) e não tem destaque — a criança ativa é o contexto mais importante de tudo e some visualmente.
- Não existe breadcrumb nem título de página consistente. O usuário perde referência dentro dos módulos.

**Dashboard (/app)**
- Cards de resumo genéricos, sem CTA claro pro próximo passo.
- Não existe entrada visual pro Mundo Azul (modo criança), que é um dos diferenciais do produto.
- Falta o "próximo momento importante" em destaque (próxima medicação, próxima sessão, próximo evento).

**Módulo Pro**
- Segue o mesmo padrão de sidebar plana, mesmos problemas de agrupamento.
- Falta indicador de paciente ativo (equivalente ao ChildPicker).

**Módulo Admin**
- Sidebar com ~25 itens plana. Agrupamento por seção (Pessoas, Conteúdo, Comércio, Sistema) resolveria imediatamente.

**Módulo Kid**
- Navegação inferior boa, mas o botão "Sair do Mundo" pouco visível.
- Falta feedback de recompensas (estrelinhas) mais celebrativo.

**Transversais**
- Sem estados de loading padronizados (uns usam skeleton, outros spinner, outros nada).
- Toasts de sucesso/erro inconsistentes entre módulos.
- Foco de teclado e acessibilidade não auditados.

---

## Onda 1 — Shell da Família (crítico, resolve o que você viu)

Foca no que você levantou: o Mundo Azul escondido + sidebar difícil de navegar.

1. **Sidebar agrupada e colapsável** usando shadcn `Sidebar` + `SidebarGroup`:
   - **Rotina & dia a dia**: Painel, Linha do tempo, Calendário, Rotinas
   - **Saúde**: Medicação, Humor, Comportamento, Documentos
   - **Desenvolvimento**: Objetivos, Relatórios, Autoavaliações, Conquistas, Biblioteca
   - **Rede de apoio**: Escola, Cuidador, Comunidade, Marketplace, Mensagens
   - **Azul IA**: item destacado no topo (não dentro de grupo)
   - **Conta**: Notificações, Assinatura, Configurações
   - Grupo do item ativo abre por padrão. Estado persiste em `localStorage`.

2. **Remover botão "Mundo Azul" da topbar**. Ele passa a ser um card destaque no Dashboard (Onda 2).

3. **ChildPicker promovido**: vira o elemento mais proeminente da topbar, com avatar da criança, nome grande, idade. Deixa claro que tudo abaixo é sobre essa criança.

4. **Título da página + breadcrumb** no topo de cada rota `/app/*`, extraído do NAV.

5. **Mobile**: menu vira drawer (`Sheet`) com os mesmos grupos colapsáveis, em vez do grid de 24 itens.

## Onda 2 — Dashboard da Família

1. **Hero card "Mundo Azul"** grande, colorido (gradiente sky/blue), com ilustração e CTA "Abrir modo criança". Explica em uma linha o que é ("Espaço lúdico e seguro para {nome} explorar sozinho").
2. **Card "Agora / A seguir"** com o próximo item importante (medicação nas próximas 2h, próxima sessão, próximo evento) em destaque no topo.
3. **Reorganização dos cards existentes** em grid bento (grande + médio + pequenos) em vez de grid uniforme.
4. **Empty states** com CTAs concretos ("Adicionar primeira medicação", "Registrar primeiro humor") em vez de texto genérico.

## Onda 3 — Padronização Pro + Admin

1. Aplicar o mesmo padrão de sidebar agrupada nos `ProShell` e `AdminShell`:
   - **Pro**: Clínico / Agenda / Documentação / IA / Conta
   - **Admin**: Pessoas / Conteúdo / Comércio / Sistema / IA
2. Adicionar seletor de paciente ativo no ProShell (equivalente ao ChildPicker).
3. Título de página + breadcrumb consistentes.

## Onda 4 — Polimento transversal

1. Padronizar loading states (skeleton em listas, spinner em ações, `Shimmer` em IA).
2. Padronizar toasts (sonner) e mensagens de erro.
3. Melhorar celebração de recompensas no módulo Kid (animação da estrelinha ao ganhar).
4. Passe de acessibilidade: foco visível, aria-labels, contraste dos gradientes.

---

## Detalhes técnicos

- **Componentes shadcn**: usar o `Sidebar` já disponível em `src/components/ui/sidebar.tsx` (troca o `<aside>` manual do `AppShell`). Grupos com `SidebarGroup` + `SidebarGroupLabel` + estado controlado por `defaultOpen` baseado na rota ativa.
- **Persistência**: estado de grupos abertos/fechados em `localStorage` (`mma:sidebar:groups`).
- **Novos arquivos**: `src/components/atlas/dashboard-mundo-azul-card.tsx`, `src/components/atlas/next-up-card.tsx`, `src/components/atlas/page-header.tsx` (título+breadcrumb reusável).
- **Sem mudanças de rota nem de backend**. Só shell e presentation. Nenhuma migration.
- **i18n**: adicionar chaves de grupos em `src/locales/pt-BR/app.json` (`sidebar.groups.*`).
- **Isolamento**: nada muda em `/kid` (só ondas 4), `/auth`, landing.

## O que fica de fora desta rodada

- Redesign visual completo (cores, tipografia). O design system atual fica.
- Novas features. É só reorganização e clareza.
- Onboarding / tour guiado (candidato pra rodada futura).

## Como sugiro executar

Começar pela **Onda 1** e te mostrar antes de seguir. Onda 1 sozinha já resolve o problema do Mundo Azul escondido (porque removemos ele daí e a Onda 2 o traz de volta com destaque no Dashboard imediatamente depois). Se aprovar o plano, faço Onda 1 + 2 na sequência (é o pacote que resolve o que você levantou) e paro pra você validar antes de Pro/Admin.
