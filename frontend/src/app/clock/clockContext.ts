import { createContext } from "react";
import { demoClock, type Clock } from "@/shared/clock";

export const ClockContext = createContext<Clock>(demoClock);
