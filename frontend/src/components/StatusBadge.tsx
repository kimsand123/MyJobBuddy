import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Design systemets Badge bygget på shadcn's Badge.
// Status-toner får altid et ikon, så farven aldrig bærer betydningen alene.

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export type StatusBadgeProps = {
  tone?: BadgeTone;
  /** Eget ikon. Status-toner har et standardikon. */
  icon?: LucideIcon;
  className?: string;
  children?: ReactNode;
};

const toneClassNames: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-secondary text-secondary-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

const statusIcons: Partial<Record<BadgeTone, LucideIcon>> = {
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
  info: Info,
};

export function StatusBadge({
  tone = "neutral",
  icon,
  className,
  children,
}: StatusBadgeProps): ReactElement {
  const Icon = icon ?? statusIcons[tone];
  return (
    <Badge
      variant="secondary"
      className={cn(
        // max-w-full og whitespace-normal: badgen bliver aldrig bredere end sin beholder (fx en
        // smal flise ved forstørret tekst); teksten ombrydes i stedet. overflow-wrap:anywhere
        // deler også et langt ord, så det ikke klippes af Badge'ens overflow-hidden.
        "min-h-6 max-w-full gap-1 rounded-sm px-2 py-0.5 text-left text-[0.8125rem] leading-4 font-semibold whitespace-normal [overflow-wrap:anywhere]",
        toneClassNames[tone],
        className,
      )}
    >
      {Icon !== undefined && <Icon className="size-3.5!" strokeWidth={2.5} aria-hidden="true" />}
      {children}
    </Badge>
  );
}
