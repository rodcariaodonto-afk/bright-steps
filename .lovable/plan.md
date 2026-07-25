## Problema

Quando o usuário troca o idioma pelo seletor (ex.: Inglês) e depois faz login, a plataforma volta para Português. A escolha manual não persiste através do login.

## Diagnóstico (a confirmar no fix)

O código atual já grava a escolha no `localStorage` (`mma:locale`) e o `LocaleSync` respeita `localStorage` antes do perfil. Mesmo assim o idioma volta para PT-BR após login. Causas prováveis, todas no fluxo de bootstrap do i18n:

1. **Bootstrap sempre inicia em `pt-BR`.** `ensureI18n()` roda no loader do root (SSR + navegação) com `initialLocale = DEFAULT_LOCALE`. Só depois, num `useEffect` do `RootComponent`, o `detectLocale()` roda e chama `changeLocale('en')`. Se o login faz reload de página (ou o subtree `_authenticated` com `ssr: false` remonta o app), a janela em que o i18n está em `pt-BR` fica visível — e em alguns caminhos o `useEffect` de detecção não roda a tempo antes do `LocaleSync` disparar por causa do `profile.locale` recém-carregado (que pode ser `null` ou `pt-BR` do signup).

2. **`LocaleSync` só reage a `profile?.locale`.** Se `getPersistedLocaleLocal()` estiver disponível mas o i18n já foi (re)bootstrapado em `pt-BR` e nenhum efeito reaplica, o idioma "trava" em PT até um novo change do perfil.

3. **Signup salva `pt-BR` no perfil** (via detecção de navegador do trigger `handle_new_user` / cliente), então em contas novas o `profile.locale = 'pt-BR'` compete com o `localStorage = 'en'`. Hoje o `localStorage` ganha — mas só se o efeito rodar.

## Plano de correção

Objetivo: a escolha manual do usuário (localStorage) ou o locale detectado se torna a verdade **antes** do i18n inicializar, e nenhum caminho de login/navegação reverte para `pt-BR`.

### 1. `src/i18n/index.ts` — bootstrap com locale certo desde o início
- Ler `localStorage.getItem('mma:locale')` e `navigator.language` sincronamente dentro do `bootstrap()` (client-side) e usar como `lng` do `i18next.init`, ignorando `DEFAULT_LOCALE` quando houver escolha manual.
- No servidor, continuar em `DEFAULT_LOCALE` (não há como saber), mas o cliente hidrata em cima com o valor correto no primeiro render.

### 2. `src/routes/__root.tsx` — `LocaleSync` mais forte
- Rodar a resolução final (`getPersistedLocaleLocal() ?? profile?.locale`) em **todo** mount do `RootComponent`, não só quando `profile?.locale` muda.
- Adicionar listener de `supabase.auth.onAuthStateChange` para, em `SIGNED_IN` e `USER_UPDATED`, reaplicar `changeLocale(getPersistedLocaleLocal() ?? profile.locale)`. Isso mata o "reset ao logar".
- Manter a regra: `localStorage` sempre vence sobre `profile.locale`.

### 3. Login "adota" a escolha do visitante
- Após `signIn` bem-sucedido, se `getPersistedLocaleLocal()` existir e for diferente de `profile.locale`, chamar `updateProfileLocale({ locale })` uma vez. Assim a conta passa a nascer/logar já com o idioma escolhido no visitante.

### 4. Signup grava locale detectado
- No fluxo de criação de conta (form de signup), enviar o locale atual (`currentLocale()`) para `updateProfileLocale` imediatamente após o `signUp`. Elimina o `pt-BR` default em contas novas de estrangeiros.

### 5. Validação
- Playwright cobrindo dois cenários no domínio local:
  a) Visitante em `pt-BR` troca para `en` → faz login → dashboard permanece em `en` após navegação entre 3 rotas.
  b) Visitante com `Accept-Language: en-US` + IP EUA → cria conta → `profile.locale = 'en'` no banco, dashboard em `en`.
- Checar console por warnings do i18n.

## Escopo fora deste plano
- Não altero traduções existentes, não mexo em `_authenticated/route.tsx` (integração-gerenciada), não toco em `client.ts`/`types.ts`.

## Detalhes técnicos

Arquivos tocados:
- `src/i18n/index.ts` (bootstrap com locale sync do localStorage/navigator)
- `src/routes/__root.tsx` (LocaleSync robusto + listener de auth)
- `src/routes/auth/*` ou hook de login existente (adotar locale do visitante após sign-in)
- Signup form (persistir locale atual no perfil recém-criado)

Chave de storage mantida: `mma:locale`. Nenhuma migração de banco necessária — coluna `profiles.locale` já existe.