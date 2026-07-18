import { Stethoscope } from "lucide-react";

export function ProLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Stethoscope className="h-4.5 w-4.5" aria-hidden="true" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-sm font-bold tracking-tight text-foreground">
          ATLAS
        </p>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Clínico
        </p>
      </div>
    </div>
  );
}
