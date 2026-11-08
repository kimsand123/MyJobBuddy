import { useId, type HTMLAttributes, type ReactElement, type Ref } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FieldError } from "./FieldError";

// Design systemets TextField bygget på shadcn's Input og Label.
// Synlig label, hjælpetekst og fejltekst ved feltet (aria-describedby). Teksten er 16px, så iOS
// ikke zoomer ind.

export type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date" | "time";
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  className?: string;
  inputClassName?: string;
  /** Bruges til at flytte fokus til feltet, fx ved en fejl efter gem. */
  inputRef?: Ref<HTMLInputElement>;
};

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  error,
  disabled = false,
  inputMode,
  autoComplete,
  className,
  inputClassName,
  inputRef,
}: TextFieldProps): ReactElement {
  const fieldId = useId();
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const hasError = error !== undefined && error !== "";
  const describedBy = cn(hint !== undefined && !hasError && hintId, hasError && errorId);

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={fieldId} className="text-label">
        {label}
      </Label>
      <Input
        ref={inputRef}
        id={fieldId}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy === "" ? undefined : describedBy}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={cn(
          "h-control rounded-md border-input bg-card px-3 text-body shadow-none md:text-body",
          "aria-invalid:border-2 aria-invalid:border-danger aria-invalid:ring-0",
          "disabled:border-dashed disabled:bg-muted disabled:opacity-100",
          inputClassName,
        )}
      />
      {hint !== undefined && !hasError && (
        <p id={hintId} className="text-body-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {hasError && <FieldError id={errorId} message={error} />}
    </div>
  );
}
