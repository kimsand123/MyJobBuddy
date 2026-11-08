import { useEffect, useState } from "react";

/** Giver værdien, når den har stået stille i delayMs. Bruges fx til live estimat i formularer. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return (): void => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
