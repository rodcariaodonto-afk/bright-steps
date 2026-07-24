## Objetivo
Monetizar o Meu Mundo Azul com **Stripe (Seamless Payments)** integrado ao Lovable, usando 3 planos com trial de 7 dias e a conta rodcaria.odonto@gmail.com como titular.

## Sobre a conta Stripe existente
A integração seamless do Lovable **cria uma nova conexão Stripe gerenciada** vinculada ao email que você informar no formulário — ela não "importa" a conta antiga automaticamente. Duas opções:

1. **Usar o mesmo email (rodcaria.odonto@gmail.com)** no formulário do Lovable → a Stripe reconhece o email e no passo de verificação você faz o *claim* da conta, unificando com a conta que já existe (dados bancários, verificação e histórico ficam disponíveis).
2. Usar outro email e manter as duas contas separadas.

Recomendo a opção 1. É o caminho mais limpo.

## Planos
| Plano | Mensal | Anual (20% off) | Trial |
|---|---|---|---|
| Família Essencial | R$ 19 | R$ 182 | 7 dias |
| Família Plus | R$ 49 | R$ 470 | 7 dias |
| Profissional Clínica | R$ 129 | R$ 1.238 | 7 dias |

Free continua ativo (acesso limitado atual).

## Etapas

### 1. Habilitar Stripe Seamless
Rodo `enable_stripe_payments`. Você preenche o formulário com **rodcaria.odonto@gmail.com** e dados da RCgrowthLAB. Sandbox liberado na hora para testes com cartão `4242 4242 4242 4242`.

### 2. Tax handling
Como o produto é digital/SaaS e o titular é BR (país não elegível para *full compliance* da Stripe), configuro **tax calculation and collection only** (+0.5%): a Stripe calcula e cobra o imposto certo no checkout, e a RCgrowthLAB cuida de registro/emissão/recolhimento no Brasil.

### 3. Cadastrar produtos
Crio os 3 produtos com preços mensal + anual e trial de 7 dias, cada um com o *tax code* correto (SaaS/serviços digitais).

### 4. Banco de dados
- `subscriptions`: `user_id`, `plan_code`, `status` (trialing/active/past_due/canceled), `stripe_subscription_id`, `stripe_customer_id`, `current_period_end`, `trial_end`, `cancel_at`. RLS: usuário lê a própria; service_role escreve.
- `subscription_events`: auditoria dos webhooks.
- Função `has_active_plan(user_id, plan_code)` para checagem rápida.

### 5. Checkout
- Rota pública `/planos`: comparativo dos 3 planos + toggle mensal/anual + CTA "Começar teste grátis".
- Rota `/app/assinatura`: plano atual, próxima cobrança, botões upgrade/downgrade/cancelar (via Stripe Customer Portal).
- Checkout via Stripe Checkout hospedado (link seguro, redireciona e volta).

### 6. Webhook
- `src/routes/api/public/stripe-webhook.ts` com verificação de assinatura HMAC.
- Processa: `customer.subscription.created/updated/deleted`, `invoice.payment_failed`, `checkout.session.completed`.
- Atualiza `subscriptions` via `supabaseAdmin` e cria notificação in-app.

### 7. Gate de acesso por plano
- **Free**: dashboard + 1 criança, sem IA nem timeline avançada.
- **Família Essencial**: timeline, humor, medicação, calendário, 1 criança.
- **Família Plus**: tudo do Essencial + IA Azul, relatórios semanais, biblioteca, autoavaliações, comunidade, marketplace, até 3 crianças.
- **Profissional Clínica**: área `/pro` completa (hoje aberta a qualquer profissional aprovado, passa a exigir assinatura ativa).
- Bloqueios mostram modal "Faça upgrade" com link pra `/planos`.

### 8. Admin de assinaturas
Refatoro `/admin/subscriptions` para listar assinaturas reais, MRR estimado, trials ativos, churn e ação manual "conceder acesso" (útil pra parceiros).

## O que você faz
1. Preencher o formulário do Stripe com **rodcaria.odonto@gmail.com** e dados da RCgrowthLAB.
2. Fazer o *claim* da conta no painel do Stripe quando quiser ativar cobrança real (usa a conta que você já tem).
3. Testar checkout com cartão sandbox.

## Fora do escopo desta onda
- Cupons, afiliados, boleto/Pix (Stripe BR ainda tem Pix limitado a certos MCCs), emails transacionais customizados (Stripe já envia recibo), in-app purchase mobile.
