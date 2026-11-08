import { LifeBuoy, Send } from "lucide-react";
import { useId, type MouseEvent, type ReactElement } from "react";
import { da } from "@/texts/da";
import { AppButton } from "./AppButton";

// Henvisning til fagforening ved alvorlige sager. "Del min sag" åbner ConsentSheet; kortet sender
// aldrig noget selv.

export type EscalationCardProps = {
  title?: string;
  text: string;
  onShare: (event: MouseEvent<HTMLButtonElement>) => void;
  onLater: () => void;
};

export function EscalationCard({
  title = da.ai.escalation.title,
  text,
  onShare,
  onLater,
}: EscalationCardProps): ReactElement {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-xl border border-info bg-info-soft p-5"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex size-tap-target flex-none items-center justify-center rounded-full bg-card text-info">
          <LifeBuoy className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h3 id={titleId} className="text-title-3">
            {title}
          </h3>
          <p className="mt-1 text-body">{text}</p>
        </div>
      </div>
      <p className="text-body-sm text-muted-foreground">{da.ai.escalation.note}</p>
      <div className="flex flex-wrap gap-2">
        <AppButton icon={Send} className="flex-[1_1_10rem]" onClick={onShare}>
          {da.ai.escalation.share}
        </AppButton>
        <AppButton variant="ghost" onClick={onLater}>
          {da.ai.escalation.later}
        </AppButton>
      </div>
    </section>
  );
}
