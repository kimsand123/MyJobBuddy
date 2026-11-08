import type { ReactElement, ReactNode } from "react";

// Overskrift for en sektion på en skærm (text-title-2). Skærmens h1 står i AppHeader.

export type SectionHeadingProps = {
  id?: string;
  children: ReactNode;
};

export function SectionHeading({ id, children }: SectionHeadingProps): ReactElement {
  return (
    <h2 id={id} className="text-title-2">
      {children}
    </h2>
  );
}
