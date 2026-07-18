import { cn } from "@/lib/utils";

interface AtlasLogoProps {
  className?: string;
  showWordmark?: boolean;
}

/**
 * Marca ATLAS: círculo (mundo) com órbita suave.
 * Sem dependência de assets — puro SVG para performance.
 */
export function AtlasLogo({ className, showWordmark = true }: AtlasLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="h-8 w-8 shrink-0"
      >
        <defs>
          <linearGradient id="atlas-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.11 165)" />
            <stop offset="100%" stopColor="oklch(0.5 0.09 175)" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="12" fill="url(#atlas-grad)" />
        <ellipse
          cx="20"
          cy="20"
          rx="18"
          ry="7"
          fill="none"
          stroke="oklch(0.78 0.13 40)"
          strokeWidth="2"
          strokeLinecap="round"
          transform="rotate(-25 20 20)"
        />
        <circle cx="35" cy="14" r="2.2" fill="oklch(0.78 0.13 40)" />
      </svg>
      {showWordmark && (
        <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
          ATLAS
        </span>
      )}
    </div>
  );
}
