import { ok, type Result } from "@/shared/result";
import { hasRuleSet } from "../agreements/ruleSetRegistry";
import type { AgreementDto } from "../apiTypes";
import type { MockRequestContext } from "./mockRequest";

// GET /agreements: overenskomstkataloget. isAvailable = overenskomsten har et regelsæt.

export function getAgreements({ store }: MockRequestContext): Result<AgreementDto[]> {
  return ok(
    store.agreementCatalog.map((agreement) => ({
      code: agreement.code,
      name: agreement.name,
      isAvailable: hasRuleSet(agreement.code),
    })),
  );
}
