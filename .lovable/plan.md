Problema

Ao trocar de idioma na landing, funciona. Ao navegar para outra rota, tudo volta a `pt-BR`.  
e mesmo abrindo em outro Pais, ela abre em portugues. ela nao identifica o local para abir na lingua local. 

**Causa raiz (confirmada por leitura de código):**

`src/routes/__root.tsx` tem:

```ts
loader: async () => { await ensureI18n(DEFAULT_LOCALE); return null; }
```

E `ensureI18n` em `src/i18n/index.ts` faz:

```ts
if (initialLocale && i18next.language !== initialLocale) {
  await i18next.changeLanguage(initialLocale);
  applyDocumentDirection(initialLocale);
}
```

Como o loader roda a cada navegação (inclusive client-side), toda mudança de página força o idioma de volta ao `DEFAULT_LOCALE` (`pt-BR`), independentemente do que o usuário escolheu no seletor ou do que está em `localStorage`/perfil.

## Correção

1. `**src/i18n/index.ts**` — mudar `ensureI18n` para NÃO forçar reset quando já inicializado. O parâmetro passa a ser apenas "idioma inicial se ainda não bootou". Se já bootou, apenas retorna a instância atual sem tocar em `changeLanguage`.
2. `**src/routes/__root.tsx**` — no `loader`, chamar `ensureI18n()` sem argumento (apenas garante bootstrap). A detecção real do idioma continua no `useEffect` do `RootComponent` (que já lê `localStorage` → perfil → IP → navegador) e no `LocaleSync`.
3. **Preservar troca via `LocaleSelector**` — nenhuma mudança adicional; após o fix, `changeLocale()` chamado pelo seletor permanecerá aplicado durante navegações porque o loader não sobrescreve mais.

## Verificação

- Playwright no preview: abrir `/`, trocar para EN via seletor, navegar para `/precos` (ou outra rota pública), confirmar que continua em EN. Recarregar a página e confirmar persistência.
- Verificar que visitantes novos (sem `localStorage`) ainda recebem o idioma detectado (IP/navegador) — comportamento inalterado, pois a detecção vive no `useEffect`, não no loader.

## Escopo NÃO incluído

- Traduções faltantes em telas internas (dashboard, admin, pro): se após o fix alguma tela continuar em PT, é porque tem texto hardcoded — abordarei numa segunda onda separada, uma tela por vez, para não misturar com este bug de reset.