import type { AgreementRuleSet } from "./agreementRuleSet";
import { hkHandelButik } from "./hkHandelButik";

// Overenskomstkode → regelsæt. En overenskomst kan kun vælges, når den har et regelsæt her.

const ruleSets: readonly AgreementRuleSet[] = [hkHandelButik];

export function findRuleSet(agreementCode: string): AgreementRuleSet | undefined {
  return ruleSets.find((ruleSet) => ruleSet.agreementCode === agreementCode);
}

export function hasRuleSet(agreementCode: string): boolean {
  return findRuleSet(agreementCode) !== undefined;
}
