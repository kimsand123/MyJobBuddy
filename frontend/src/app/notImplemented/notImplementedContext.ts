import { createContext } from "react";

/**
 * Det, der åbnede dialogen: selve elementet eller et event, hvis currentTarget er elementet.
 * Fokus sættes tilbage på det, når dialogen lukker.
 */
export type NotImplementedTrigger = HTMLElement | { currentTarget: EventTarget | null };

/**
 * Åbner dialogen "Ikke implementeret". Uden provider gør funktionen ingenting.
 * Uden udløser bruges det element, der har fokus; det virker kun for tastaturbrugere, fordi
 * Safari på iPhone ikke giver en knap fokus ved tryk.
 */
export type ShowNotImplemented = (trigger?: NotImplementedTrigger) => void;

const doNothing: ShowNotImplemented = () => undefined;

export const NotImplementedContext = createContext<ShowNotImplemented>(doNothing);
