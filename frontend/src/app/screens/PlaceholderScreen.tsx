import type { ReactElement } from "react";

// Pladsholder for skærmene i Fase A. Erstattes af de rigtige skærme i Fase B.
// Hjem har ingen titel i AppHeader, så dér er overskriften sidens h1. Ellers er den h2.

export type PlaceholderScreenProps = {
  title: string;
  isPageHeading: boolean;
};

export function PlaceholderScreen({ title, isPageHeading }: PlaceholderScreenProps): ReactElement {
  if (isPageHeading) {
    return <h1 className="text-title-1">{title}</h1>;
  }
  return <h2 className="text-title-2">{title}</h2>;
}
