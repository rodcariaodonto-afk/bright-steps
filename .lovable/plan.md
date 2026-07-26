# Gravar regra de arquitetura em memória do projeto

## O que fazer

1. Criar `mem://architecture/tss-rls-clients.md` (type: `preference`) com o conteúdo:

   - **Rotas TSS (`src/routes/api/*`, não `createServerFn`)** que leem/escrevem dado protegido por RLS DEVEM extrair o client via `createUserScopedSupabaseFromRequest(request)` — nunca client anônimo, nunca `service_role`.
   - **Sintoma de esquecimento:** query roda sem erro, mas retorna vazio/nulo mesmo com dado existente. RLS bloqueou silenciosamente porque o client não carregava o JWT do usuário.
   - **Streams de chat** (`useChat` / `DefaultChatTransport`) que dependem de contexto autorizado: usar `createAuthedChatTransport`, não `DefaultChatTransport` puro — senão o header `Authorization` não vai e o client vira anônimo do outro lado.
   - **Referência:** fix aplicado em `src/integrations/supabase/user-scoped.server.ts` + `src/lib/authed-chat-transport.ts` (consent gate da IA Azul, jul/2026).

2. Atualizar `mem://index.md`:
   - Adicionar linha em **Core**: `Rotas TSS com RLS → createUserScopedSupabaseFromRequest; chat streams → createAuthedChatTransport. Nunca anon/service_role.`
   - Adicionar entrada em **Memories** apontando para o arquivo acima.

Nenhuma mudança de código — só memória.
