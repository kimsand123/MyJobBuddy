// Deterministisk tilfældighed (mulberry32), så en monkey test kan genskabes ud fra sit seed.

export type Random = {
  /** Tal i [0, 1). */
  next: () => number;
  /** Heltal i [0, count). */
  index: (count: number) => number;
};

export function createSeededRandom(seed: number): Random {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    index: (count: number) => Math.floor(next() * count),
  };
}

/**
 * Seedet læses fra miljøvariablen MONKEY_SEED, så en fejl kan genskabes. Ellers bruges et fast
 * seed pr. rute, så testen ikke afhænger af tidspunktet.
 */
export function monkeySeed(defaultSeed: number): number {
  const fromEnvironment = process.env.MONKEY_SEED;
  if (fromEnvironment === undefined || fromEnvironment.trim() === "") {
    return defaultSeed;
  }
  const parsed = Number.parseInt(fromEnvironment, 10);
  return Number.isNaN(parsed) ? defaultSeed : parsed;
}
