import type { ReactElement } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { ShiftForm } from "@/components/ShiftForm";
import { da } from "@/texts/da";
import type { ShiftRegistrationOptions } from "./shiftRegistrationTypes";
import { useShiftRegistrationWidget } from "./useShiftRegistrationWidget";

// View: arket "Tilføj vagt" med ShiftForm. Renderes med en ny key ved hver åbning, så
// formularen starter forfra.

export type ShiftRegistrationWidgetProps = ShiftRegistrationOptions & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
};

export function ShiftRegistrationWidget({
  open,
  onOpenChange,
  onCloseAutoFocus,
  ...options
}: ShiftRegistrationWidgetProps): ReactElement {
  const registration = useShiftRegistrationWidget(options);
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={da.shiftForm.title}
      description={da.shiftForm.description}
      onCloseAutoFocus={onCloseAutoFocus}
    >
      <ShiftForm
        values={registration.values}
        jobOptions={registration.jobOptions}
        errors={registration.errors}
        formError={registration.formError}
        summary={registration.summary}
        submitting={registration.submitting}
        focusRequest={registration.focusRequest}
        onChange={registration.change}
        onSubmit={registration.submit}
        onCancel={() => {
          onOpenChange(false);
        }}
      />
    </BottomSheet>
  );
}
