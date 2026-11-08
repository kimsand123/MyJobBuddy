import { Send } from "lucide-react";
import { useId, useRef, type FormEvent, type ReactElement } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { da } from "@/texts/da";

// Feltet til fritekst med send-knap og forbrug ("3 af 5 spørgsmål tilbage").
// onSend får send-knappen med, så fx en dialog kan sætte fokus tilbage på den.

export type ChatInputProps = {
  value: string;
  remaining?: number;
  total?: number;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSend: (trigger: HTMLElement | undefined) => void;
};

export function ChatInput({
  value,
  remaining,
  total,
  disabled = false,
  onChange,
  onSend,
}: ChatInputProps): ReactElement {
  const inputId = useId();
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const isEmpty = value.trim().length === 0;
  const outOfQuestions = remaining === 0;

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (isEmpty) {
      return;
    }
    onSend(sendButtonRef.current ?? undefined);
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-lg bg-card px-4 py-3 shadow-card"
    >
      <label htmlFor={inputId} className="text-label">
        {da.ai.input.label}
      </label>
      <div className="flex items-end gap-2">
        <Textarea
          id={inputId}
          rows={1}
          value={value}
          disabled={disabled || outOfQuestions}
          placeholder={
            outOfQuestions ? da.ai.input.outOfQuestionsPlaceholder : da.ai.input.placeholder
          }
          onChange={(event) => {
            onChange(event.target.value);
          }}
          className="max-h-36 min-h-control flex-1 resize-none rounded-xl border-input bg-card px-3 py-3 text-body shadow-none md:text-body disabled:border-dashed disabled:bg-muted"
        />
        <button
          ref={sendButtonRef}
          type="submit"
          aria-label={da.ai.input.send}
          disabled={disabled || outOfQuestions || isEmpty}
          className="inline-flex size-control flex-none items-center justify-center rounded-full bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          <Send className="size-5.5" aria-hidden="true" />
        </button>
      </div>
      {remaining !== undefined && total !== undefined && (
        <p
          className={cn(
            "text-body-sm",
            outOfQuestions ? "font-semibold text-warning" : "text-muted-foreground",
          )}
        >
          {outOfQuestions ? da.ai.input.none : da.ai.input.remaining(remaining, total)}
        </p>
      )}
    </form>
  );
}
