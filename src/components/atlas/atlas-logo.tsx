import { cn } from "@/lib/utils";

interface AtlasLogoProps {
  className?: string;
  showWordmark?: boolean;
}

/**
 * Marca "Meu Mundo Azul": símbolo do infinito (neurodiversidade / autismo)
 * em gradiente azul. Puro SVG — sem dependência de assets.
 */
export function AtlasLogo({ className, showWordmark = true }: AtlasLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 48 32"
        aria-hidden="true"
        className="h-8 w-auto shrink-0"
      >
        <defs>
          <linearGradient id="mma-infinity" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.14 240)" />
            <stop offset="50%" stopColor="oklch(0.58 0.17 250)" />
            <stop offset="100%" stopColor="oklch(0.48 0.14 220)" />
          </linearGradient>
        </defs>
        {/* Símbolo do infinito — símbolo da neurodiversidade/autismo */}
        <path
          d="M14 16 C14 9, 22 9, 24 16 C26 23, 34 23, 34 16 C34 9, 26 9, 24 16 C22 23, 14 23, 14 16 Z"
          fill="none"
          stroke="url(#mma-infinity)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWordmark && (
        <span className="font-display text-lg font-extrabold leading-none tracking-tight text-foreground">
          Meu Mundo Azul
        </span>
      )}
    </div>
  );
}
