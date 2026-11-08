import { CircleAlert } from "lucide-react";
import type { ReactElement } from "react";

// Fejltekst ved et felt. Feltet peger på den med aria-describedby.

export type FieldErrorProps = {
  id: string;
  message: string;
};

export function FieldError({ id, message }: FieldErrorProps): ReactElement {
  return (
    <p id={id} className="flex items-start gap-1 text-label text-danger">
      <CircleAlert className="mt-0.5 size-4 flex-none" aria-hidden="true" />
      {message}
    </p>
  );
}
