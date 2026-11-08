import type { LucideIcon } from "lucide-react";
import type { MouseEvent, ReactElement, ReactNode } from "react";
import { Link } from "react-router";
import { StatusBadge, type BadgeTone } from "./StatusBadge";

// Felt på Hjem. Med `to` er feltet et link (navigation); ellers en knap (handling).

export type FeatureTileStatus = {
  tone: Extract<BadgeTone, "success" | "warning" | "danger" | "info">;
  text: string;
};

export type FeatureTileProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: FeatureTileStatus;
  to?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

// min-w-0 og w-full: flisen holder sig inden for sin kolonne i gitteret, også med forstørret tekst.
const tileClassName =
  "flex min-h-33 w-full min-w-0 flex-col items-start gap-3 rounded-lg bg-card p-4 text-left text-foreground shadow-card active:bg-accent active:shadow-raised";

type TileContentProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: FeatureTileStatus;
};

function TileContent({ icon: Icon, title, description, status }: TileContentProps): ReactNode {
  return (
    <>
      {/* Er der ikke plads til badgen ved siden af ikonet, går den ned på næste linje. */}
      <span className="flex w-full min-w-0 flex-wrap items-start justify-between gap-2">
        <span className="inline-flex size-tap-target flex-none items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        {status !== undefined && <StatusBadge tone={status.tone}>{status.text}</StatusBadge>}
      </span>
      <span className="w-full min-w-0 break-words">
        <span className="block text-title-3">{title}</span>
        <span className="mt-0.5 block text-body-sm text-muted-foreground">{description}</span>
      </span>
    </>
  );
}

export function FeatureTile({
  icon,
  title,
  description,
  status,
  to,
  onClick,
}: FeatureTileProps): ReactElement {
  if (to !== undefined) {
    return (
      <Link to={to} className={tileClassName}>
        <TileContent icon={icon} title={title} description={description} status={status} />
      </Link>
    );
  }
  return (
    <button type="button" className={tileClassName} onClick={onClick}>
      <TileContent icon={icon} title={title} description={description} status={status} />
    </button>
  );
}
