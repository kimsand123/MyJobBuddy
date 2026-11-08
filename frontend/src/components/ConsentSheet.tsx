import { Check, EyeOff, Send } from "lucide-react";
import type { MouseEvent, ReactElement } from "react";
import type { SharedItem } from "@/shared/viewTypes";
import { da } from "@/texts/da";
import { AppButton } from "./AppButton";
import { BottomSheet } from "./BottomSheet";

// Ark, der viser præcis, hvad der deles og ikke deles, før brugeren deler sin sag.

export type ConsentSheetProps = {
  open: boolean;
  recipient: string;
  shared: readonly SharedItem[];
  notShared: readonly string[];
  onConfirm: (event: MouseEvent<HTMLButtonElement>) => void;
  onCancel: () => void;
  onCloseAutoFocus?: (event: Event) => void;
};

export function ConsentSheet({
  open,
  recipient,
  shared,
  notShared,
  onConfirm,
  onCancel,
  onCloseAutoFocus,
}: ConsentSheetProps): ReactElement {
  return (
    <BottomSheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
      title={da.ai.consentSheet.title(recipient)}
      description={da.ai.consentSheet.description}
      onCloseAutoFocus={onCloseAutoFocus}
    >
      <h3 className="mb-2 text-label">{da.ai.consentSheet.sharedTitle}</h3>
      <ul className="mb-4 flex flex-col gap-2">
        {shared.map((item) => (
          <li key={item.label} className="flex items-start gap-3 rounded-md bg-background p-3">
            <Check
              className="size-5 flex-none text-muted-foreground"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <strong className="block font-semibold">{item.label}</strong>
              <span className="text-body-sm text-muted-foreground">{item.value}</span>
            </div>
          </li>
        ))}
      </ul>
      <h3 className="mb-2 text-label">{da.ai.consentSheet.notSharedTitle}</h3>
      <ul className="mb-4 flex flex-col gap-2">
        {notShared.map((itemLabel) => (
          <li key={itemLabel} className="flex items-start gap-3 rounded-md bg-muted p-3">
            <EyeOff className="size-5 flex-none text-muted-foreground" aria-hidden="true" />
            <strong className="font-semibold">{itemLabel}</strong>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        <AppButton size="lg" block icon={Send} onClick={onConfirm}>
          {da.ai.consentSheet.confirm(recipient)}
        </AppButton>
        <AppButton variant="ghost" block onClick={onCancel}>
          {da.common.cancel}
        </AppButton>
      </div>
    </BottomSheet>
  );
}
