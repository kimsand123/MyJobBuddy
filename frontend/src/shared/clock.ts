// Injicérbar "i dag", så demoen og tests ikke afhænger af det aktuelle tidspunkt.

/** ISO-dato (ÅÅÅÅ-MM-DD) for demoens "i dag". */
export const demoToday = "2026-10-31";

export type Clock = {
  /** I dag som ISO-dato (ÅÅÅÅ-MM-DD). */
  today: () => string;
};

export function createFixedClock(isoDate: string): Clock {
  return { today: () => isoDate };
}

export const demoClock: Clock = createFixedClock(demoToday);
