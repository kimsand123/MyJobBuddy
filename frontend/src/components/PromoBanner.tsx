import { Sparkles, type LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { Link } from "react-router";

// Navy banner på Hjem med en handling, der navigerer (link med knappens udseende).

export type PromoBannerProps = {
  title: string;
  text: string;
  actionLabel: string;
  to: string;
  icon?: LucideIcon;
};

export function PromoBanner({
  title,
  text,
  actionLabel,
  to,
  icon: Icon = Sparkles,
}: PromoBannerProps): ReactElement {
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-xl bg-navy p-5 text-navy-foreground min-[360px]:flex-nowrap">
      <span className="inline-flex size-12 flex-none items-center justify-center rounded-full bg-navy-accent/15 text-navy-accent">
        <Icon className="size-6.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-title-3">{title}</h2>
        <p className="mt-0.5 text-body-sm">{text}</p>
      </div>
      <Link
        to={to}
        className="inline-flex min-h-tap-target w-full flex-none items-center justify-center rounded-md bg-navy-foreground px-3 text-label text-navy active:scale-[0.98] min-[360px]:w-auto"
      >
        {actionLabel}
      </Link>
    </section>
  );
}
