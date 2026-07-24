## Análise do texto vs. o que já temos

O texto descreve funções que **já existem** no Meu Mundo Azul:
- Registro de rotinas → `/app/rotina`
- Observação de padrões de comportamento → `/app/comportamento` (ABC)
- Compartilhamento com equipe multidisciplinar → convite de profissionais + chat + documentos
- Autonomia e organização para cuidadores → dashboard família + timeline + calendário

E aponta lacunas que **ainda não temos**:

| Tema do texto | Status hoje |
|---|---|
| Conteúdo educativo (alimentação, comunicação funcional, manejo de comportamentos) | Faltando (CMS admin existe, mas sem consumo na família) |
| Ferramentas de autoavaliação para acompanhar progresso | Faltando (só escalas clínicas no `/pro`) |
| Detecção automática de padrões de comportamento | Parcial (dados existem, sem insights) |
| Suporte emocional ao cuidador | Faltando (comunidade existe, mas sem trilha específica) |
| Dados de conscientização (1 em 100, 2M no Brasil) | Faltando (landing não cita) |

## Onda P: Biblioteca + Autoavaliações + Bem estar do cuidador

### P.1 Biblioteca de Conteúdo Educativo
- Tabelas: `library_articles` (título, slug, categoria, corpo markdown, capa, tempo de leitura, autor, publicado_em, tags, público-alvo: família/profissional/ambos) e `library_categories`.
- Categorias iniciais: Alimentação seletiva, Comunicação funcional (CAA/PECS), Manejo de comportamentos desafiadores, Sono, Autorregulação, Escola inclusiva, Direitos e LGPD.
- `/app/biblioteca` (família): listagem por categoria, busca, marcadores de "salvo" e "lido".
- `/pro/biblioteca` (profissional): mesmo acervo + filtro "material para entregar à família" com botão "compartilhar com paciente" (gera item na timeline da criança).
- `/admin/cms`: CRUD de artigos e categorias (usar CMS existente como base).
- IA (Azul): sugestão contextual de artigo com base no que a família registrou na semana (ex.: 3 registros de recusa alimentar → sugere trilha "Alimentação seletiva").

### P.2 Autoavaliações e Triagens
- Tabela `assessments` (definições) + `assessment_responses` (respostas por criança).
- Instrumentos iniciais (versões educativas, sem valor diagnóstico, com aviso claro):
  - M-CHAT-R (triagem de sinais de TEA em 16 a 30 meses)
  - Escala de qualidade do sono infantil
  - Escala de sobrecarga do cuidador (Zarit reduzida)
  - Autoavaliação de rotina (marcos mensais)
- `/app/autoavaliacoes`: aplica questionário, salva resposta, mostra evolução em gráfico e libera artigo relacionado da biblioteca.
- IA gera resumo em linguagem cuidadosa ("isto não é diagnóstico, procure profissional").
- Resultado aparece no perfil da criança e nos relatórios semanais.

### P.3 Insights automáticos de padrões
- Server function que roda sobre `behavior_events`, `mood_logs`, `medication_logs` dos últimos 30 dias e devolve padrões (ex.: "gatilho sensorial mais frequente: barulho, principalmente após 18h").
- Novo card "Padrões detectados" no dashboard família e nas sessões do profissional.
- Reaproveita motor de IA existente (`src/modules/ai`).

### P.4 Trilha "Bem estar do cuidador"
- Categoria dedicada na biblioteca (respiração, higiene do sono do cuidador, rede de apoio, quando pedir ajuda).
- Widget de auto check-in de humor do cuidador no dashboard família (tabela nova `caregiver_mood_logs`, RLS por `auth.uid()`).
- Integração com escala de sobrecarga (P.2): quando pontuação alta, IA sugere trilha e conteúdos.

### P.5 Landing com dados de conscientização
- Seção "Por que o Meu Mundo Azul existe" na `/`:
  - "1 em 100 crianças no mundo" (OMS)
  - "2 milhões de pessoas no Brasil convivem com o TEA"
  - "Muitas famílias enfrentam barreiras para diagnóstico, tratamento e apoio"
- Fontes citadas no rodapé.
- Meta tags (og/twitter) atualizadas para refletir o novo posicionamento.

## Detalhes técnicos

- Todas as tabelas novas: RLS + GRANTs padrão + triggers de `updated_at`.
- `library_articles` com política pública `TO anon SELECT WHERE published_at IS NOT NULL` para permitir SEO das páginas de artigo (`/biblioteca/$slug`) e compartilhamento externo.
- Autoavaliações e humor do cuidador com RLS estrita por `auth.uid()`.
- Server functions em `src/modules/library/` e `src/modules/assessments/`.
- Reutilizar `AppShell` e `ProShell`; adicionar itens de menu e strings PT-BR.
- Insights (P.3) via `google/gemini-3.5-flash` (rápido e barato), com cache de 24h por criança.

## Ordem de execução sugerida
1. P.1 Biblioteca (base para P.4 e recomendação da IA)
2. P.2 Autoavaliações
3. P.3 Insights automáticos
4. P.4 Bem estar do cuidador
5. P.5 Landing com dados de conscientização

## Fora do escopo desta onda
- Meu Diário TEA como app mobile separado (o site já cumpre a função; PWA fica para depois).
- Publicação nas lojas (App Store / Play).
- Novos idiomas de conteúdo (biblioteca começa em PT-BR).

Posso executar tudo em sequência, ou você prefere só uma parte (ex.: começar por P.1 + P.5)?
