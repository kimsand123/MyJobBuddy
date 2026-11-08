import { CircleCheck, X } from "lucide-react";
import { useId, type ReactElement, type Ref } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { da } from "@/texts/da";
import { StatusBadge } from "./StatusBadge";

// Samtykke med shadcn's Switch. Labelen er trykflade (mindst 44px høj, label for switchen), og
// switchen ligger i et felt på mindst 44 × 44 px. Status vises også som tekst (Til/Fra).

export type ConsentToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  switchRef?: Ref<HTMLButtonElement>;
};

export function ConsentToggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
  switchRef,
}: ConsentToggleProps): ReactElement {
  const switchId = useId();
  const descriptionId = `${switchId}-description`;
  return (
    <div
      className={cn("flex items-start gap-3 py-4 pr-2 pl-4", disabled && "text-muted-foreground")}
    >
      <div className="min-w-0 flex-1">
        <label
          htmlFor={switchId}
          className={cn(
            "flex min-h-tap-target items-center text-title-3",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          {label}
        </label>
        <p id={descriptionId} className="mb-2 text-body-sm text-muted-foreground">
          {description}
        </p>
        <StatusBadge tone={checked ? "success" : "neutral"} icon={checked ? CircleCheck : X}>
          {checked ? da.consent.on : da.consent.off}
        </StatusBadge>
      </div>
      <span className="inline-flex min-h-tap-target min-w-tap-target items-center justify-center">
        <Switch
          ref={switchRef}
          id={switchId}
          checked={checked}
          disabled={disabled}
          aria-describedby={descriptionId}
          onCheckedChange={onChange}
          className="h-8 w-13 [&>span]:size-6! [&>span]:data-[state=checked]:translate-x-6! [&>span]:data-[state=unchecked]:translate-x-0.5!"
        />
      </span>
    </div>
  );
}
