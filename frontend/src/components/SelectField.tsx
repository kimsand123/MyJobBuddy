import { useId, type ReactElement, type Ref } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SelectOption } from "@/shared/viewTypes";
import { FieldError } from "./FieldError";

// Valgfelt med synlig label, bygget på shadcn's Select. Bruges til job.

export type SelectFieldProps = {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  /** Bruges til at flytte fokus til feltet, fx ved en fejl efter gem. */
  triggerRef?: Ref<HTMLButtonElement>;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  error,
  disabled = false,
  className,
  triggerRef,
}: SelectFieldProps): ReactElement {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const hasError = error !== undefined && error !== "";

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={fieldId} className="text-label">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          ref={triggerRef}
          id={fieldId}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className="w-full rounded-md border-input bg-card px-3 text-body text-foreground shadow-none data-[size=default]:h-control"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="min-h-tap-target text-body"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasError && <FieldError id={errorId} message={error} />}
    </div>
  );
}
