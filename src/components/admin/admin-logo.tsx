import { Shield } from "lucide-react";

export function AdminLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
        <Shield className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-foreground">ATLAS</p>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Admin
        </p>
      </div>
    </div>
  );
}
