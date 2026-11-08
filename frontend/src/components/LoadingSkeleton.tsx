import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

// Indlæsning. Skeletterne er dekorative; label læses op via role="status".
// Pulsen stopper ved prefers-reduced-motion.

export type LoadingSkeletonProps = {
  variant?: "list" | "card" | "text";
  rows?: number;
  label: string;
};

type SkeletonProps = {
  className?: string;
};

function Skeleton({ className }: SkeletonProps): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cn("block h-4 rounded-sm bg-muted motion-safe:animate-pulse", className)}
    />
  );
}

export function LoadingSkeleton({
  variant = "list",
  rows = 3,
  label,
}: LoadingSkeletonProps): ReactElement {
  const rowIndexes = Array.from({ length: rows }, (_unused, index) => index);
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {variant === "card" && (
        <div className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-card">
          <Skeleton className="h-6 w-3/5" />
          <Skeleton />
          <Skeleton className="w-3/4" />
        </div>
      )}
      {variant === "text" &&
        rowIndexes.map((index) => (
          <Skeleton key={index} className={index === rows - 1 ? "w-3/5" : "w-full"} />
        ))}
      {variant === "list" &&
        rowIndexes.map((index) => (
          <div key={index} className="flex items-center gap-3 rounded-lg bg-card p-4 shadow-card">
            <Skeleton className="size-13 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4.5 w-1/2" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </div>
        ))}
    </div>
  );
}
