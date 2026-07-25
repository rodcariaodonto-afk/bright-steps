import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: { label: string; to?: string }[];
  actions?: ReactNode;
}

/**
 * Cabeçalho reutilizável para rotas do /app.
 * Padroniza título + descrição + breadcrumb + ações.
 */
export function PageHeader({ title, description, breadcrumb, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-3 border-b border-border/60 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav aria-label="Trilha" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {breadcrumb.map((item, i) => (
              <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
                {item.to ? (
                  <Link to={item.to} className="hover:text-foreground">
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
                {i < breadcrumb.length - 1 && (
                  <ChevronRight className="h-3 w-3 opacity-60" aria-hidden="true" />
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
