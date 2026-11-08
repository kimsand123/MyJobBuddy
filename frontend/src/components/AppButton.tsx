import { LoaderCircle, type LucideIcon } from "lucide-react";
import type { MouseEvent, ReactElement, ReactNode, Ref } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Design systemets Button bygget på shadcn's Button.
// Trykflader: sm 44px, md 48px (control-height), lg 56px (control-height-lg).
// onClick får eventet, så fx useNotImplemented() kan sætte fokus tilbage på knappen.

export type AppButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "destructive" | "navy";
export type AppButtonSize = "sm" | "md" | "lg";

export type AppButtonProps = {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  className?: string;
  type?: "button" | "submit";
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  "aria-label"?: string;
  ref?: Ref<HTMLButtonElement>;
  children?: ReactNode;
};

const variantClassNames: Record<AppButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-card text-foreground hover:bg-accent active:bg-accent",
  ghost: "bg-transparent text-primary hover:bg-accent active:bg-accent",
  destructive: "border border-destructive bg-card text-destructive hover:bg-danger-soft",
  navy: "bg-navy-foreground text-navy hover:bg-navy-foreground/90",
};

const sizeClassNames: Record<AppButtonSize, string> = {
  sm: "min-h-tap-target px-3 text-label",
  md: "min-h-control px-5 text-button",
  lg: "min-h-control-lg px-6 text-title-3",
};

export function AppButton({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  type = "button",
  onClick,
  "aria-label": ariaLabel,
  ref,
  children,
}: AppButtonProps): ReactElement {
  return (
    <Button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "h-auto min-w-tap-target gap-2 rounded-md whitespace-normal transition-transform active:scale-[0.98]",
        "disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100",
        variantClassNames[variant],
        sizeClassNames[size],
        block && "w-full",
        className,
      )}
    >
      {loading ? (
        <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" />
      ) : (
        Icon !== undefined && <Icon className="size-5" aria-hidden="true" />
      )}
      {children}
      {!loading && IconRight !== undefined && <IconRight className="size-5" aria-hidden="true" />}
    </Button>
  );
}
