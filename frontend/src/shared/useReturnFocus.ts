import { useCallback, useRef } from "react";

// Ark og dialoger, der åbnes styret (uden Radix' Trigger), ved ikke, hvor fokus skal tilbage.
// remember() gemmer knappen, der åbnede dem (send event.currentTarget med – på iPhone får en knap
// ikke fokus ved tryk), og restore() bruges som onCloseAutoFocus.

export type ReturnFocus = {
  remember: (trigger: EventTarget | null) => void;
  restore: (event: Event) => void;
};

export function useReturnFocus(): ReturnFocus {
  const triggerRef = useRef<HTMLElement | undefined>(undefined);

  const remember = useCallback((trigger: EventTarget | null): void => {
    triggerRef.current = trigger instanceof HTMLElement ? trigger : undefined;
  }, []);

  const restore = useCallback((event: Event): void => {
    const trigger = triggerRef.current;
    triggerRef.current = undefined;
    if (trigger === undefined || !trigger.isConnected) {
      return;
    }
    event.preventDefault();
    trigger.focus();
  }, []);

  return { remember, restore };
}
