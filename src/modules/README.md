# Módulos ATLAS

Estrutura modular do produto. Cada módulo isola componentes, hooks, services, repositories, schemas e tipos próprios — nada de regra de negócio dentro de componentes.

## Regras

1. **Nada de import cruzado entre módulos.** Se dois módulos precisam do mesmo conceito, ele pertence a `src/lib/` ou a um módulo `core`.
2. **Textos sempre via i18n** (`useTranslation("<namespace>")`). Nunca hardcoded.
3. **Toda regra de negócio em `services/`.** Componentes só orquestram.
4. **Repositórios encapsulam acesso ao Supabase.** Trocar de backend não deve tocar em componentes.

## Módulos previstos

- `family/` — módulo principal do ciclo 1
- `child/` — experiência infantil (mundo, avatar, jogos, histórias)
- `professional/` — painel do terapeuta/psicólogo/fono
- `school/` — integração escolar
- `community/` — grupos, perguntas, especialistas
- `marketplace/` — profissionais, cursos, produtos
- `games/` — engine reutilizável de mini-jogos
- `stories/` — histórias sociais interativas geradas por IA
- `admin/` — painel administrativo da plataforma
- `ai/` — orquestração de prompts, ferramentas e contexto para o Atlas
