import { ok, type Result } from "@/shared/result";
import type { ProfileDto, SubscriptionDto } from "../apiTypes";
import type { MockRequestContext } from "./mockRequest";

// GET /profile og GET /subscription.

export function getProfile({ store }: MockRequestContext): Result<ProfileDto> {
  return ok({
    firstName: store.profile.firstName,
    age: store.profile.age,
  });
}

export function getSubscription({ store }: MockRequestContext): Result<SubscriptionDto> {
  return ok({
    currentPlanCode: store.subscription.currentPlanCode,
    questionsRemaining: store.subscription.questionsRemaining,
    questionsTotal: store.subscription.questionsTotal,
    plans: store.plans,
  });
}
