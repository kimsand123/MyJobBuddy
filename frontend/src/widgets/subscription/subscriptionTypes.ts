import type { PlanCode } from "@/shared/apiSchemas";
import type { PlanUsage } from "@/shared/viewTypes";
import type { WidgetError } from "@/shared/widgetError";

// Tilstand for abonnementet under Mig.

export type PlanView = {
  code: PlanCode;
  name: string;
  price: string;
  features: readonly string[];
  current: boolean;
  usage: PlanUsage | undefined;
  /** Undefined for det nuværende abonnement (ingen knap). */
  ctaLabel: string | undefined;
};

export type SubscriptionState =
  | { status: "loading" }
  | { status: "error"; error: WidgetError; retry: () => void }
  | { status: "ready"; plans: readonly PlanView[] };
