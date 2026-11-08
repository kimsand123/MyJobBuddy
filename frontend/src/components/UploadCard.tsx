import { FileText, Upload } from "lucide-react";
import type { MouseEvent, ReactElement } from "react";
import { AppButton } from "./AppButton";

// Upload af et dokument. Demoen har kun starttilstanden ("idle"); selve upload er ikke bygget.

export type UploadCardProps = {
  title: string;
  description: string;
  hint: string;
  selectLabel: string;
  onSelect: (event: MouseEvent<HTMLButtonElement>) => void;
};

export function UploadCard({
  title,
  description,
  hint,
  selectLabel,
  onSelect,
}: UploadCardProps): ReactElement {
  return (
    <section className="flex flex-col gap-4 rounded-lg bg-card p-5 shadow-card">
      <div>
        <h2 className="text-title-2">{title}</h2>
        <p className="mt-1 text-body-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-input bg-background px-4 py-6 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Upload className="size-7" aria-hidden="true" />
        </span>
        <p className="text-body-sm text-muted-foreground">{hint}</p>
        <AppButton icon={FileText} onClick={onSelect}>
          {selectLabel}
        </AppButton>
      </div>
    </section>
  );
}
