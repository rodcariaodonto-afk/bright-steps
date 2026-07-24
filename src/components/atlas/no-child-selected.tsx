import { Link } from "@tanstack/react-router";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NoChildSelected({ hint }: { hint?: string }) {
  return (
    <div className="p-6 lg:p-10">
      <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-primary/30 bg-primary-soft/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Baby className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-foreground">
          Selecione uma criança
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {hint ??
            "Cadastre ou escolha uma criança no topo para acompanhar aqui."}
        </p>
        <Button asChild className="mt-5 rounded-full">
          <Link to="/app/crianca">Ir para Crianças</Link>
        </Button>
      </div>
    </div>
  );
}
