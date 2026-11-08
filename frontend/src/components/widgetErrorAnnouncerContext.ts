import { createContext } from "react";

/** Annoncerer for skærmlæsere, at en widget er fejlet. Uden tekst: "Noget gik galt". */
export type AnnounceWidgetError = (text?: string) => void;

/** undefined = ingen WidgetErrorAnnouncer over boundaryen; så annoncerer den selv. */
export const WidgetErrorAnnouncerContext = createContext<AnnounceWidgetError | undefined>(
  undefined,
);
