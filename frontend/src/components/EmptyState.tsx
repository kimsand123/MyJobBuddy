import { Inbox, Plus, type LucideIcon } from "lucide-react";
import type { MouseEvent, ReactElement } from "react";
import { AppButton } from "./AppButton";

// Tom tilstand: ikon, titel, tekst og evt. en handling.
// headingLevel 3 bruges, når tilstanden står i en sektion, der selv har en h2.

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  text: string;
  headingLevel?: 2 | 3;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: (event: MouseEvent<HTMLButtonElement>) => void;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  text,
  headingLevel = 2,
  actionLabel,
  actionIcon = Plus,
  onAction,
}: EmptyStateProps): ReactElement {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg bg-card px-5 py-8 text-center shadow-card">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <Heading className="text-title-3">{title}</Heading>
      <p className="max-w-[32ch] text-body-sm text-muted-foreground">{text}</p>
      {actionLabel !== undefined && (
        <AppButton icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </AppButton>
      )}
    </section>
  );
}
