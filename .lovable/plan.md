## Plano de correção

O problema visível é que, no domínio publicado e em contas novas, partes do app aparecem como `sidebar.dashboard`, `dashboard.greeting.evening`, `landing:hero.title` etc. Em vez de depender do i18n durante o primeiro carregamento, vou remover essa fragilidade das telas críticas.

### 1. Eliminar i18n das áreas críticas em produção
- Trocar as chamadas `t(...)` por textos PT-BR diretos na landing page `/`.
- Trocar as chamadas `t(...)` por textos PT-BR diretos no shell da família `/app`.
- Trocar as chamadas `t(...)` por textos PT-BR diretos no dashboard inicial `/app`.
- Manter o visual e a estrutura atuais, mudando apenas a origem dos textos.

### 2. Criar fallback seguro para traduções restantes
- Ajustar a inicialização global de tradução para nunca exibir a chave crua quando uma tradução falhar.
- Isso reduz o risco de outras telas mostrarem códigos técnicos ao usuário.

### 3. Verificar no navegador
- Conferir a rota `/app` no preview após a correção.
- Validar que o menu lateral, saudação e textos principais aparecem legíveis em português.

### 4. Publicação
- Depois da implementação, publicar/atualizar o site novamente para substituir o bundle que está servindo textos quebrados no domínio público.