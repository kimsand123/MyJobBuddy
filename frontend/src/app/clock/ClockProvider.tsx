import type { ReactElement, ReactNode } from "react";
import type { Clock } from "@/shared/clock";
import { ClockContext } from "./clockContext";

export type ClockProviderProps = {
  clock: Clock;
  children: ReactNode;
};

export function ClockProvider({ clock, children }: ClockProviderProps): ReactElement {
  return <ClockContext value={clock}>{children}</ClockContext>;
}
