
Você está certo, Rodrigo. Hoje **qualquer usuário logado** acessa `/pro`, o que expõe telas clínicas (pacientes, sessões, evolução) a famílias e visitantes. Isso precisa ser corrigido, e junto vamos abrir um caminho oficial para profissionais se cadastrarem.

## O que vamos entregar

### 1. Novo papel `professional` no sistema de roles
- Adicionar `professional` ao enum `app_role` (hoje temos `admin` e `user`).
- Toda a lógica passa pela tabela `user_roles` + função `has_role`, mantendo o padrão seguro que já usamos para admin.
- Admins continuam vendo tudo (Família, Clínico e Admin).

### 2. Gate real no módulo `/pro`
- `src/routes/pro.tsx` deixa de aceitar "qualquer sessão" e passa a exigir `has_role(uid, 'professional')` **ou** `has_role(uid, 'admin')`.
- Sem o papel: redireciona para uma nova página `/seja-profissional` (explicada abaixo), sem quebrar a experiência da família.
- No `AppShell` (família) e no menu superior, o link "Área Clínica" só aparece para quem tem o papel.

### 3. Fluxo público de cadastro profissional
Nova rota pública **`/seja-profissional`** (landing + formulário) com:
- Explicação do marketplace (benefícios, requisitos, LGPD).
- CTA "Quero me cadastrar" que exige login (redireciona para `/auth` e volta).
- Formulário de solicitação com: nome completo, conselho (CRP/CRM/CREFITO/etc.), número, UF do conselho, especialidades, cidade/estado, modalidade (presencial/online), bio curta, foto, e-mail e telefone de contato, aceite dos termos.
- Ao enviar: cria/atualiza a linha em `professional_profiles` com `moderation_status = 'pending'` e `visible_in_marketplace = false`.
- Enquanto pendente: usuário vê tela "Solicitação em análise" e **não** recebe o papel `professional`.

### 4. Moderação pelo Admin (aproveitando o que já existe)
- `/admin/marketplace` já lista profissionais e permite aprovar/recusar/definir plano.
- Ajuste: **ao aprovar**, o backend também insere `('professional')` em `user_roles` para aquele `user_id`; ao rejeitar/pendenciar, remove o papel. Assim o acesso à área clínica é consequência direta da aprovação no marketplace, sem passo manual duplicado.
- Rejeição já grava `rejection_reason` (aparece para o profissional na tela "Solicitação recusada", com opção de reenviar).

### 5. Perfil profissional (auto atendimento)
- `/pro/perfil` continua existindo para o profissional aprovado editar dados públicos.
- Se ele alterar campos críticos (nome, conselho), o status volta a `pending` e o admin revisa novamente (opcional, configurável — proponho ligado por padrão para conformidade).

## Detalhes técnicos

**Migração SQL (uma migration única):**
1. `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professional';`
2. Backfill: para cada `professional_profiles` com `moderation_status = 'approved'`, inserir `(user_id, 'professional')` em `user_roles` (`ON CONFLICT DO NOTHING`).
3. Função `public.sync_professional_role()` (SECURITY DEFINER, `search_path = public`) + trigger `AFTER INSERT OR UPDATE OF moderation_status ON professional_profiles`: quando `NEW.moderation_status = 'approved'` insere o papel; caso contrário, remove.
4. Sem novas tabelas — reutilizamos `professional_profiles` e `user_roles`.

**Server functions:**
- `submitProfessionalApplication` (novo, `requireSupabaseAuth`): valida com Zod e faz upsert em `professional_profiles` forçando `moderation_status = 'pending'` e `visible_in_marketplace = false`.
- `getMyProfessionalApplicationStatus` (novo, `requireSupabaseAuth`): devolve status atual + `rejection_reason` para a tela de acompanhamento.
- `moderateProfessional` existente: sem mudança na assinatura — o trigger acima cuida do `user_roles` automaticamente.

**Gate do `/pro`:**
- `beforeLoad` no `src/routes/pro.tsx` chama uma nova server fn `getMyClinicalAccess` que retorna `{ hasAccess, reason }` consultando `has_role` pelo `supabase` autenticado. Sem acesso → `redirect({ to: "/seja-profissional" })`.

**Navegação:**
- `AppShell` esconde o botão "Área Clínica" quando o usuário não tem role `professional`/`admin`.
- Nova entrada no menu do avatar: "Sou profissional" (leva para `/seja-profissional` ou `/pro` se já aprovado).

## Fora do escopo agora
- Verificação automática do número no conselho (CFP/CRM). Fica como validação manual do admin.
- Cobrança/planos pagos para profissionais (Onda futura, quando ativarmos Stripe).
- Upload de comprovante do conselho como documento (podemos incluir se quiser — diga sim/não).

## Ordem de implementação
1. Migration (enum + trigger + backfill).
2. Server fns (`submit`, `status`, `getMyClinicalAccess`).
3. Rota `/seja-profissional` (landing + formulário + tela de status).
4. Gate real no `/pro` + esconder link no AppShell.
5. Ajuste visual em `/admin/marketplace` mostrando que aprovar concede acesso clínico.
6. Teste end-to-end com sua conta admin + uma conta comum.

Se aprovar, sigo direto. Confirma se quero **incluir upload de comprovante do conselho** no formulário público?
