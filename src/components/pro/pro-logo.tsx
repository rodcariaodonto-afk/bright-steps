export function ProLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <InfinitySymbol className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-sm font-bold tracking-tight text-foreground">
          Meu Mundo Azul
        </p>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Clínico
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
