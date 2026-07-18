export function AdminLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
        <InfinitySymbol className="h-4.5 w-4.5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-foreground">Meu Mundo Azul</p>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Admin
        </p>
      </div>
    </div>
  );
}

function InfinitySymbol({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" aria-hidden="true" className={className}>
      <path
        d="M14 16 C14 9, 22 9, 24 16 C26 23, 34 23, 34 16 C34 9, 26 9, 24 16 C22 23, 14 23, 14 16 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
