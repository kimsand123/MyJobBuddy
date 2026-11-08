import { X } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { da } from "@/texts/da";

// Ark fra bunden (shadcn Sheet, side="bottom") efter design systemet: radius-xl foroven,
// shadow-sheet og padding-bottom med env(safe-area-inset-bottom). Lukkeknappen er 44 × 44 px.
// Åbnes arket styret, sendes onCloseAutoFocus fra useReturnFocus(), så fokus kommer tilbage.

export type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onCloseAutoFocus?: (event: Event) => void;
  children: ReactNode;
};

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  onCloseAutoFocus,
  children,
}: BottomSheetProps): ReactElement {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        onCloseAutoFocus={onCloseAutoFocus}
        {...(description === undefined ? { "aria-describedby": undefined } : {})}
        className="mx-auto max-h-[92dvh] w-full max-w-content gap-0 overflow-y-auto rounded-t-xl border-0 bg-popover px-5 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-sheet"
      >
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-input" />
        <SheetHeader className="mb-4 flex-row items-start justify-between gap-2 p-0">
          <div className="flex min-w-0 flex-col gap-1">
            <SheetTitle className="text-title-2 text-foreground">{title}</SheetTitle>
            {description !== undefined && (
              <SheetDescription className="text-body-sm text-muted-foreground">
                {description}
              </SheetDescription>
            )}
          </div>
          <SheetClose asChild>
            <button
              type="button"
              aria-label={da.common.close}
              className="-mt-1 -mr-2 inline-flex size-tap-target flex-none items-center justify-center rounded-full text-foreground active:bg-accent"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </SheetClose>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
