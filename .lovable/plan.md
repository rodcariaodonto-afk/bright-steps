# Go-live do Stripe — Meu Mundo Azul

O go-live acontece quase todo dentro do Stripe, não no código. Não preciso alterar nada no projeto — os 12 novos preços em USD/EUR que criei hoje são sincronizados automaticamente para o ambiente live quando você concluir os passos abaixo.

## Onde começar
No editor do Lovable → aba **Payments** → alternar para **Live**. Você verá 5 passos. Os 3 primeiros são feitos por você no Stripe; os 2 últimos são automáticos.

## Passo 1 — Reivindicar a conta Stripe
Clique em **Claim** no passo 1. Abre uma página do Stripe:
- Se já tem conta Stripe: **Sign in** e vincule.
- Se não tem: crie com e-mail, nome, senha e país (Brasil).

Confirme o e-mail de verificação que o Stripe envia.

## Passo 2 — Ativar a conta para pagamentos reais
Botão **Stripe dashboard** no passo 2. Preencha o wizard "Activate your account":
1. **Verify your business** — tipo (PF ou PJ), CPF/CNPJ, endereço, descrição do negócio, site (meumundoazul.app), categoria.
2. **Add your bank** — conta bancária brasileira para receber os repasses.
3. **Secure your account** — 2FA obrigatório (app autenticador ou SMS).
4. **Add extras** (opcional agora) — pode pular.
5. **Review and submit**.

Ao final, o Stripe pergunta o que copiar da sandbox para a conta live. **Escolha "Copy" e mantenha marcado o app da Lovable** (assim os produtos, preços e o app instalado migram juntos e você pula o passo 3).

## Passo 3 — Instalar o app da Lovable na conta live
Só aparece como pendente se você não copiou o app no passo 2. Se aparecer, clique no CTA e autorize a instalação.

## Passo 4 — Provisionamento das chaves live (automático)
Assim que o passo 3 fica verde, o Stripe dispara webhooks e a Lovable provisiona sozinha:
- Chaves publishable e secret de live
- Endpoint de webhook live
- Secrets sincronizados no backend

Sem ação sua. Costuma levar alguns segundos a poucos minutos.

## Passo 5 — Readiness check (automático)
A Lovable roda uma checagem final validando produtos, preços e webhook. Se algo falhar, aparece um botão **"Ask Lovable to fix"** que abre um chat comigo para corrigir.

## O que acontece com o que já está no ar
- Os **9 produtos** (3 planos × 3 moedas × 2 períodos) são copiados para live junto com os `lookup_key` (`familia_plus_monthly_usd` etc). O código não muda.
- O ambiente do checkout é decidido pelo prefixo do token: preview usa `pk_test_` (sandbox), o site publicado passa a usar `pk_live_` automaticamente.
- A tabela `subscriptions` já separa por `environment` (sandbox/live), então nada mistura.

## Sobre a "compliance handling" (tax + fraude + disputas)
Quando a conta live estiver ativa, posso ativar o `managed_payments: { enabled: true }` no checkout — Stripe passa a lidar com imposto, fraude, disputas e suporte transacional em ~80 países. Custa +3,5% por transação. Fica pra decidir depois do go-live, sem pressa.

## Detalhes técnicos
- O URL do webhook live é o mesmo `/api/public/payments/webhook?env=live` já implementado; o secret `PAYMENTS_LIVE_WEBHOOK_SECRET` é gravado no passo 4 automaticamente.
- Nada em `src/` precisa ser editado para o go-live. Só volte a me chamar se o passo 5 apontar alguma falha.

Quer que eu já publique a versão atual com os preços multi-moeda antes de você começar o fluxo, ou prefere publicar depois que o Stripe estiver ativo?
