import { describe, expect, it } from "vitest";
import type { SupplementKind, SupplementRule } from "@/mockApi/agreements/agreementRuleSet";
import { hkHandelButik } from "@/mockApi/agreements/hkHandelButik";
import { findRuleSet, hasRuleSet } from "@/mockApi/agreements/ruleSetRegistry";

function ruleFor(kind: SupplementKind): SupplementRule | undefined {
  return hkHandelButik.supplementRules.find((rule) => rule.kind === kind);
}

describe("hkHandelButik", () => {
  it("hkHandelButik_HourlyWage_Is9250Oere", () => {
    // Assert
    expect(hkHandelButik.hourlyWageOere).toBe(9250);
  });

  it("hkHandelButik_Pause_IsPaid", () => {
    // Assert
    expect(hkHandelButik.pauseIsPaid).toBe(true);
  });

  it("hkHandelButik_SickShift_HasNoSupplements", () => {
    // Assert
    expect(hkHandelButik.sickShiftIncludesSupplements).toBe(false);
  });

  it("hkHandelButik_EveningRule_After1800MondayToFridayAt3000", () => {
    // Act
    const rule = ruleFor("evening");

    // Assert
    expect(rule?.fromMinuteOfDay).toBe(18 * 60);
    expect(rule?.rateOerePerHour).toBe(3000);
    expect([...(rule?.weekdays ?? [])].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("hkHandelButik_SaturdayRule_After1500SaturdayAt4000", () => {
    // Act
    const rule = ruleFor("saturday");

    // Assert
    expect(rule?.fromMinuteOfDay).toBe(15 * 60);
    expect(rule?.rateOerePerHour).toBe(4000);
    expect([...(rule?.weekdays ?? [])]).toEqual([6]);
  });

  it("hkHandelButik_SundayRule_WholeDaySundayAt4500", () => {
    // Act
    const rule = ruleFor("sunday");

    // Assert
    expect(rule?.fromMinuteOfDay).toBe(0);
    expect(rule?.rateOerePerHour).toBe(4500);
    expect([...(rule?.weekdays ?? [])]).toEqual([0]);
  });

  it("hkHandelButik_SupplementRules_ExactlyThreeKinds", () => {
    // Act
    const kinds = hkHandelButik.supplementRules.map((rule) => rule.kind).sort();

    // Assert
    expect(kinds).toEqual(["evening", "saturday", "sunday"]);
  });
});

describe("ruleSetRegistry", () => {
  it("findRuleSet_HkHandelButik_ReturnsRuleSet", () => {
    // Act
    const ruleSet = findRuleSet(hkHandelButik.agreementCode);

    // Assert
    expect(ruleSet).toEqual(hkHandelButik);
  });

  it("findRuleSet_UnknownCode_ReturnsUndefined", () => {
    // Act
    const ruleSet = findRuleSet("findes-ikke");

    // Assert
    expect(ruleSet).toBeUndefined();
  });

  it("findRuleSet_EmptyCode_ReturnsUndefined", () => {
    // Act
    const ruleSet = findRuleSet("");

    // Assert
    expect(ruleSet).toBeUndefined();
  });

  it("hasRuleSet_HkHandelButik_ReturnsTrue", () => {
    // Act
    const exists = hasRuleSet("hk-handel-butik");

    // Assert
    expect(exists).toBe(true);
  });

  it("hasRuleSet_UnknownCode_ReturnsFalse", () => {
    // Act
    const exists = hasRuleSet("findes-ikke");

    // Assert
    expect(exists).toBe(false);
  });
});
