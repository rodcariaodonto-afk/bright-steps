## Objetivo
Implementar monetização via **Paddle (Seamless Payments)** no Meu Mundo Azul com 3 planos, trial de 7 dias, controle de acesso por assinatura e portal do usuário para gerenciar cobrança.

## Planos definidos

| Plano | Preço mensal | Preço anual (20% off) | Trial | Público |
|---|---|---|---|---|
| Família Essencial | R$ 19/mês | R$ 182/ano | 7 dias | 1 criança, funcionalidades básicas |
| Família Plus | R$ 49/mês | R$ 470/ano | 7 dias | até 3 crianças, IA Azul completa, relatórios, biblioteca, comunidade |
| Profissional Clínica | R$ 129/mês | R$ 1.238/ano | 7 dias | profissional individual, pacientes ilimitados, agenda, SOAP |
| Free (mantido) | R$ 0 | , | , | acesso limitado atual |

Empresa vinculada: **RCgrowthLAB** (verificação só na hora de ativar modo live).

## Etapas de implementação

### 1. Habilitar Paddle (sandbox)
- Rodar `recommend_payment_provider` para validar elegibilidade do produto.
- Rodar `enable_paddle_payments` , você preenche o formulário (email, nome, RCgrowthLAB).
- Sandbox liberado na hora, dá pra testar checkout com cartões de teste.

### 2. Cadastrar produtos e preços no Paddle
- Criar os 3 produtos (Essencial, Plus, Profissional) via `batch_create_product`.
- Cada produto com 2 preços: mensal e anual.
- Configurar trial de 7 dias em todos.

### 3. Modelagem no banco (Supabase)
Nova tabela `subscriptions` para espelhar o estado da assinatura do Paddle:
- `user_id`, `plan_code` (essencial/plus/profissional), `status` (trialing/active/past_due/canceled), `paddle_subscription_id`, `paddle_customer_id`, `current_period_end`, `trial_end`, `cancel_at`, timestamps.
- RLS: usuário lê só a própria; service_role escreve (via webhook).
- Tabela `subscription_events` para auditoria de eventos do Paddle.
- Função `has_active_plan(user_id, plan_code)` para checagem rápida.

### 4. Checkout no app
- Nova rota `/app/assinatura` (Minha Assinatura): mostra plano atual, próxima cobrança, botões upgrade/downgrade/cancelar.
- Nova rota `/planos` (pública): tabela comparativa dos 3 planos + toggle mensal/anual + CTA "Começar teste grátis".
- Checkout via **Paddle.js overlay** (script embedado, não redireciona), passando `customer.email` do usuário logado.
- Após sucesso, mostra tela de confirmação e redireciona pro `/app`.

### 5. Webhook do Paddle
- Nova rota pública `src/routes/api/public/paddle-webhook.ts`.
- Verifica assinatura HMAC do Paddle antes de processar (secret armazenado via `add_secret`).
- Processa eventos: `subscription.created`, `subscription.updated`, `subscription.canceled`, `subscription.past_due`, `transaction.completed`.
- Atualiza `subscriptions` via `supabaseAdmin` e cria notificação in-app pro usuário.

### 6. Gate de acesso por plano
Middleware simples no frontend + validação no backend:
- **Família Essencial:** timeline, humor, medicação, calendário, 1 criança.
- **Família Plus:** tudo do Essencial + IA Azul, relatórios semanais, biblioteca, autoavaliações, comunidade, marketplace, até 3 crianças.
- **Profissional Clínica:** área `/pro` completa (hoje aberta a qualquer profissional aprovado, passa a exigir assinatura ativa).
- **Free:** apenas dashboard e cadastro de 1 criança, sem IA nem timeline avançada.
- Bloqueios mostram modal "Faça upgrade" com link pra `/planos`.

### 7. Admin , gestão de assinaturas
- Refatorar `/admin/subscriptions` (hoje só catálogo estático) pra:
  - Listar todas as assinaturas ativas/trial/canceladas.
  - Métricas: MRR estimado, churn mensal, trials ativos, conversão trial → pago.
  - Ação manual "conceder acesso" (grant admin, útil pra parceiros).

### 8. Emails transacionais (opcional nesta onda)
Paddle já envia recibo automático. Podemos adicionar depois:
- Email de "trial acabando em 2 dias".
- Email de "pagamento falhou, atualize o cartão".
Fica sinalizado como próxima onda pra não travar essa entrega.

## Detalhes técnicos

- **Provider:** Paddle Billing (não Paddle Classic).
- **Frontend:** Paddle.js v2 carregado via `<script>` no `__root.tsx`, envolvido em `ClientOnly` (é browser-only).
- **Server functions:** `src/modules/billing/api.functions.ts` , `getMySubscription`, `startCheckout`, `getPortalUrl`, `cancelSubscription`.
- **Webhook:** validação com `crypto.timingSafeEqual`, secret via `PADDLE_WEBHOOK_SECRET` (Você vai precisar cadastrar no painel do Paddle e colar aqui).
- **Currency:** BRL cobrado no cliente, repasse USD/EUR conforme banco configurado no Paddle.

## O que você (Rodrigo) vai precisar fazer

1. Preencher o formulário do Paddle quando eu chamar o enable (email + dados da RCgrowthLAB).
2. Depois, colar o **Webhook Secret** que o Paddle gera (te passo o passo a passo na hora).
3. Testar o checkout com cartão sandbox (Paddle fornece números tipo `4242 4242 4242 4242`).
4. Quando quiser ir pra live, subir os documentos da RCgrowthLAB no painel do Paddle.

## Fora do escopo desta onda
- Cupons de desconto e afiliados.
- Emails transacionais customizados (Paddle já envia recibo).
- Faturamento anual com boleto (Paddle não suporta boleto nativo).
- App mobile (in-app purchase Apple/Google) , exige adaptações específicas depois.
