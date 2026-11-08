import { ChevronLeft, type LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { da } from "@/texts/da";
import { Logo } from "./Logo";

// Topbjælken: logo og en handling (fx klokken) på Hjem, eller tilbage-knap og titel på undersider.
// padding-top: env(safe-area-inset-top), så intet ligger under notch eller Dynamic Island.

export type HeaderAction = {
  icon: LucideIcon;
  label: string;
  /** Får knappen med, så fx en dialog kan sætte fokus tilbage på den, når den lukker. */
  onClick?: (trigger: HTMLButtonElement) => void;
  /** Prik på ikonet = "nye". Står også i knappens navn. */
  badge?: boolean;
  disabled?: boolean;
};

export type AppHeaderProps = {
  /** Udelades på Hjem, så vises logoet. */
  title?: string;
  onBack?: () => void;
  action?: HeaderAction;
};

const iconButtonClassName =
  "relative inline-flex size-tap-target flex-none items-center justify-center rounded-full text-foreground active:bg-accent disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-60";

export function AppHeader({ title, onBack, action }: AppHeaderProps): ReactElement {
  return (
    <header className="sticky top-0 z-10 bg-background pt-[env(safe-area-inset-top)]">
      <div
        className={cn(
          "mx-auto flex min-h-header w-full max-w-content items-center gap-2 pr-2",
          onBack === undefined ? "pl-4" : "pl-1",
        )}
      >
        {onBack !== undefined && (
          <button
            type="button"
            className={iconButtonClassName}
            onClick={onBack}
            aria-label={da.navigation.back}
          >
            <ChevronLeft size={28} aria-hidden="true" />
          </button>
        )}

        {title === undefined ? (
          <div className="min-w-0 flex-1">
            <Logo size={32} />
          </div>
        ) : (
          <h1 className="min-w-0 flex-1 truncate text-[1.0625rem] leading-[1.375rem] font-bold">
            {title}
          </h1>
        )}

        {action !== undefined && <HeaderActionButton action={action} />}
      </div>
    </header>
  );
}

type HeaderActionButtonProps = {
  action: HeaderAction;
};

function HeaderActionButton({ action }: HeaderActionButtonProps): ReactElement {
  const Icon = action.icon;
  const hasBadge = action.badge === true;
  const label = hasBadge ? `${action.label}${da.navigation.newSuffix}` : action.label;
  return (
    <button
      type="button"
      className={iconButtonClassName}
      onClick={(event) => action.onClick?.(event.currentTarget)}
      disabled={action.disabled}
      aria-label={label}
    >
      <Icon size={24} aria-hidden="true" />
      {hasBadge && (
        <span
          aria-hidden="true"
          className="absolute top-[9px] right-[10px] size-2.5 rounded-full border-2 border-background bg-primary"
        />
      )}
    </button>
  );
}
