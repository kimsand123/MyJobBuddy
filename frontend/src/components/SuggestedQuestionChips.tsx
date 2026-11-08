import { MessageCircleQuestion } from "lucide-react";
import { useId, type ReactElement } from "react";
import type { SuggestedQuestion } from "@/shared/viewTypes";
import { da } from "@/texts/da";

// Forslag til spørgsmål som chips (mindst 44px høje).

export type SuggestedQuestionChipsProps = {
  questions: readonly SuggestedQuestion[];
  disabled?: boolean;
  onSelect: (questionId: string) => void;
};

export function SuggestedQuestionChips({
  questions,
  disabled = false,
  onSelect,
}: SuggestedQuestionChipsProps): ReactElement {
  const labelId = useId();
  return (
    <div>
      <p id={labelId} className="mb-2 text-label text-muted-foreground">
        {da.ai.suggestions}
      </p>
      <ul aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <li key={question.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onSelect(question.id);
              }}
              className="inline-flex min-h-tap-target items-center gap-2 rounded-full border border-input bg-card px-4 py-2 text-left text-[0.9375rem] leading-5 text-foreground active:bg-secondary disabled:cursor-not-allowed disabled:border-dashed disabled:bg-muted disabled:text-muted-foreground"
            >
              <MessageCircleQuestion className="size-4.5 flex-none" aria-hidden="true" />
              {question.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
