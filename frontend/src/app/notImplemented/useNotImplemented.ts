import { use } from "react";
import { NotImplementedContext, type ShowNotImplemented } from "./notImplementedContext";

/**
 * Giver en funktion, der åbner dialogen "Ikke implementeret".
 *
 * Send altid udløseren med, så fokus kommer tilbage til knappen, når dialogen lukker. Det er
 * nødvendigt på iPhone, hvor et tryk ikke giver knappen fokus:
 *   <Button onClick={showNotImplemented}>            (eventet sendes med)
 *   <Button onClick={(event) => showNotImplemented(event.currentTarget)}>
 */
export function useNotImplemented(): ShowNotImplemented {
  return use(NotImplementedContext);
}
