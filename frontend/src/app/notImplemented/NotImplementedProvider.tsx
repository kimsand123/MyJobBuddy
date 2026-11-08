import { useCallback, useRef, useState, type ReactElement, type ReactNode } from "react";
import { NotImplementedContext, type NotImplementedTrigger } from "./notImplementedContext";
import { NotImplementedDialog } from "./NotImplementedDialog";

// Én fælles dialog for hele appen. Knapper, der ikke er implementeret, kalder useNotImplemented().
// Dialogen åbnes uden Radix' DialogTrigger, så Radix ved ikke, hvor fokus skal tilbage.
// Derfor gemmes udløseren, når dialogen åbnes, og fokus sættes tilbage på den, når dialogen
// lukkes (WCAG 2.4.3). Udløseren gives af kalderen; ellers bruges det element, der har fokus.

export type NotImplementedProviderProps = {
  children: ReactNode;
};

function currentlyFocusedElement(): HTMLElement | undefined {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement) || activeElement === document.body) {
    return undefined;
  }
  return activeElement;
}

function resolveTrigger(trigger: NotImplementedTrigger | undefined): HTMLElement | undefined {
  if (trigger instanceof HTMLElement) {
    return trigger;
  }
  if (trigger !== undefined && trigger.currentTarget instanceof HTMLElement) {
    return trigger.currentTarget;
  }
  return currentlyFocusedElement();
}

export function NotImplementedProvider({ children }: NotImplementedProviderProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(false);
  const triggerRef = useRef<HTMLElement | undefined>(undefined);

  const show = useCallback((trigger?: NotImplementedTrigger): void => {
    // Mens dialogen er åben, beholdes den oprindelige udløser. Ellers ville et nyt kald pege
    // fokus på OK-knappen inde i dialogen.
    if (!isOpenRef.current) {
      triggerRef.current = resolveTrigger(trigger);
    }
    isOpenRef.current = true;
    setIsOpen(true);
  }, []);

  const changeOpen = useCallback((open: boolean): void => {
    isOpenRef.current = open;
    setIsOpen(open);
  }, []);

  const returnFocus = useCallback((event: Event): void => {
    const trigger = triggerRef.current;
    triggerRef.current = undefined;
    if (trigger === undefined || !trigger.isConnected) {
      return;
    }
    event.preventDefault();
    trigger.focus();
  }, []);

  return (
    <NotImplementedContext value={show}>
      {children}
      <NotImplementedDialog
        open={isOpen}
        onOpenChange={changeOpen}
        onCloseAutoFocus={returnFocus}
      />
    </NotImplementedContext>
  );
}
