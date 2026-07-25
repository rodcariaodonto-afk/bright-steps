## Diagnóstico

A seção **Comércio** do Painel Admin tem 5 abas. Apenas **Assinaturas** está funcional. As outras 4 são placeholders (`<AdminPage title=... />` sem conteúdo):

- `/admin/marketplace` — placeholder
- `/admin/community` — placeholder
- `/admin/finance` — placeholder
- `/admin/coupons` — placeholder
- `/admin/subscriptions` — ✅ já funcional

## Objetivo

Implementar as 4 abas restantes com CRUD/analytics reais conectados ao Supabase, mantendo o padrão do Super Admin (server functions + auditoria + RLS admin-only).

## Escopo por aba

### 1. Marketplace (`/admin/marketplace`)
Gestão dos profissionais listados publicamente em `professional_profiles`.
- Tabela: nome, conselho, especialidade, status de moderação (`pending/approved/rejected`), rating médio, nº reviews.
- Ações: aprovar, rejeitar, suspender, editar destaque (`featured`), remover.
- Filtros: status, especialidade, busca por nome.
- Métricas topo: total aprovados, pendentes, taxa média de aprovação.

### 2. Community (`/admin/community`)
Moderação de `community_posts` e `community_comments`.
- Feed de posts recentes com autor, likes, comentários, data.
- Ações: ocultar/remover post, remover comentário, banir autor (via `admin_audit_log`).
- Filtros: reportados, mais curtidos, recentes.
- Métricas: posts hoje/semana, comentários hoje, top autores.

### 3. Finance (`/admin/finance`)
Visão financeira consolidada (leitura de `subscriptions` + cortesias).
- KPIs: MRR, ARR, receita últimos 30/90 dias, ticket médio, churn %.
- Gráfico (Recharts): receita mensal últimos 12 meses.
- Tabela: últimas 50 transações (usuário, plano, valor, status, data).
- Export CSV de transações do período.

### 4. Coupons (`/admin/coupons`)
Sistema de cupons de desconto integrado ao checkout Stripe.
- Nova tabela `public.coupons`: `code`, `discount_type` (percent/fixed), `discount_value`, `max_redemptions`, `redemptions_count`, `valid_until`, `applies_to_plan`, `active`, `created_by`, timestamps.
- Migration com RLS: apenas admin gerencia; leitura pública restrita durante validação no checkout.
- CRUD completo (criar, editar, desativar, deletar).
- Tabela com cupons ativos, expirados, esgotados.
- Botão "Copiar código" e status visual.

## Backend

Novo módulo: `src/modules/admin/commerce.functions.ts` com server functions autenticadas via `requireSupabaseAuth` + verificação `has_role(admin)`:
- `listMarketplaceProfessionals`, `moderateProfessional`, `toggleFeatured`
- `listCommunityPosts`, `moderatePost`, `deleteComment`
- `getFinanceMetrics`, `listRecentTransactions`, `exportTransactionsCsv`
- `listCoupons`, `createCoupon`, `updateCoupon`, `deleteCoupon`

Cada mutação registra em `admin_audit_log`.

## Migration

```sql
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value numeric NOT NULL,
  max_redemptions integer,
  redemptions_count integer NOT NULL DEFAULT 0,
  valid_until timestamptz,
  applies_to_plan text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
```

## Design

Mantém identidade do Admin (neutros, cards com borda sutil, `AdminPage` wrapper). Tabelas com paginação simples, badges de status coloridos (verde/âmbar/vermelho), gráficos Recharts consistentes com `/admin/analytics`.

## Entrega

Uma resposta implementa as 4 rotas + módulo backend + migration. Valida tipos com `tsgo` ao final.