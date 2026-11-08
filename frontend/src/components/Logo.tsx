import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { appName } from "@/texts/da";

// App-mærket "Spor" (et j i én tyk streg med en prik over) og navnet.
// tile: mærket på en primary-firkant med hvid streg og prik i navy-accent.
// Uden tile: streg i primary og prik i primary-bright.

export type LogoMarkProps = {
  size?: number;
  tile?: boolean;
};

export function LogoMark({ size = 32, tile = true }: LogoMarkProps): ReactElement {
  const glyphTransform = tile
    ? "translate(32 32) scale(0.95) translate(-28 -30.5)"
    : "translate(4 1.5)";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="flex-none">
      {tile && <rect className="fill-primary" width={64} height={64} rx={18} />}
      <g transform={glyphTransform}>
        <path
          className={cn(tile ? "stroke-primary-foreground" : "stroke-primary")}
          d="M38 28v10a10 10 0 0 1-20 0"
          fill="none"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <circle
          className={cn(tile ? "fill-navy-accent" : "fill-primary-bright")}
          cx={38}
          cy={14}
          r={6}
        />
      </g>
    </svg>
  );
}

export type LogoProps = {
  size?: number;
  showName?: boolean;
  tile?: boolean;
};

export function Logo({ size = 32, showName = true, tile = true }: LogoProps): ReactElement {
  return (
    <span className="inline-flex items-center gap-2 text-foreground">
      <LogoMark size={size} tile={tile} />
      <span
        className={cn(
          showName
            ? "text-[1.125rem] leading-[1.375rem] font-extrabold tracking-[-0.01em]"
            : "sr-only",
        )}
      >
        {appName}
      </span>
    </span>
  );
}
