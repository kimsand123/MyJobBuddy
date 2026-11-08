import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { da } from "@/texts/da";

export type NotImplementedDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kaldes, når dialogen lukker. Bruges til at sætte fokus tilbage på det, der åbnede den. */
  onCloseAutoFocus?: (event: Event) => void;
};

export function NotImplementedDialog({
  open,
  onOpenChange,
  onCloseAutoFocus,
}: NotImplementedDialogProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={onCloseAutoFocus}
        className="max-w-[min(calc(100%-2rem),24rem)] rounded-xl bg-card"
      >
        <DialogHeader>
          <DialogTitle className="text-title-2">{da.notImplemented.title}</DialogTitle>
          <DialogDescription className="text-body text-muted-foreground">
            {da.notImplemented.text}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="h-control w-full text-button">{da.notImplemented.ok}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
