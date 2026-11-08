import { describe, expect, it } from "vitest";
import type { ConsentsDto, ProfileDto, SubscriptionDto } from "@/mockApi/apiTypes";
import { createTestApi } from "../../testUtils/mockApiTestClient";

describe("GET /profile", () => {
  it("getProfile_Seed_ReturnsMaja17", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const profile = await api.data<ProfileDto>("GET", "/profile");

    // Assert
    expect(profile).toEqual({ firstName: "Maja", age: 17 });
  });
});

describe("GET /subscription", () => {
  it("getSubscription_Seed_FreePlanWith3Of5QuestionsLeft", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const subscription = await api.data<SubscriptionDto>("GET", "/subscription");

    // Assert
    expect(subscription.currentPlanCode).toBe("free");
    expect(subscription.questionsRemaining).toBe(3);
    expect(subscription.questionsTotal).toBe(5);
  });

  it("getSubscription_Seed_HasThreePlans", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const subscription = await api.data<SubscriptionDto>("GET", "/subscription");

    // Assert
    const codes = subscription.plans.map((plan) => plan.code).sort();
    expect(codes).toEqual(["free", "payPerQuestion", "plus"]);
  });

  it("getSubscription_Seed_PlusCosts29KrPerMonth", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const subscription = await api.data<SubscriptionDto>("GET", "/subscription");

    // Assert
    const plus = subscription.plans.find((plan) => plan.code === "plus");
    expect(plus?.priceOere).toBe(2900);
    expect(plus?.billingPeriod).toBe("month");
  });

  it("getSubscription_Seed_PayPerQuestionIsBilledPerQuestion", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const subscription = await api.data<SubscriptionDto>("GET", "/subscription");

    // Assert
    const payPerQuestion = subscription.plans.find((plan) => plan.code === "payPerQuestion");
    expect(payPerQuestion?.billingPeriod).toBe("question");
  });
});

describe("GET /consents", () => {
  it("getConsents_Seed_SicknessConsentIsOff", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const consents = await api.data<ConsentsDto>("GET", "/consents");

    // Assert
    expect(consents).toEqual({ sicknessConsent: false });
  });
});
