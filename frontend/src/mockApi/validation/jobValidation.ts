import type { FieldErrorCode } from "@/shared/fieldErrorCode";
import { fail, ok, type Result } from "@/shared/result";
import { hasRuleSet } from "../agreements/ruleSetRegistry";
import type { MockStore } from "../storeTypes";
import { isRequestBody, readTextField, type RequestBody } from "./requestFields";

// Validering af et nyt job. Feltnavne: workplace, position, agreementCode.
// Regler: alle tre felter skal udfyldes, og kun overenskomster med et regelsæt kan vælges.

export type ValidJobInput = {
  workplace: string;
  position: string;
  agreementCode: string;
};

type JobField = "workplace" | "position" | "agreementCode";
type JobFieldErrors = Partial<Record<JobField, FieldErrorCode>>;

const maxTextLength = 100;

function validateText(
  body: RequestBody,
  field: "workplace" | "position",
  errors: JobFieldErrors,
): string | undefined {
  const text = readTextField(body, field);
  if (text.status === "missing") {
    errors[field] = "required";
    return undefined;
  }
  if (text.status === "invalid") {
    errors[field] = "invalidFormat";
    return undefined;
  }
  if (text.value.length > maxTextLength) {
    errors[field] = "tooLong";
    return undefined;
  }
  return text.value;
}

function validateAgreement(
  store: MockStore,
  body: RequestBody,
  errors: JobFieldErrors,
): string | undefined {
  const code = readTextField(body, "agreementCode");
  if (code.status === "missing") {
    errors.agreementCode = "required";
    return undefined;
  }
  if (code.status === "invalid") {
    errors.agreementCode = "invalidFormat";
    return undefined;
  }
  const isInCatalog = store.agreementCatalog.some((agreement) => agreement.code === code.value);
  if (!isInCatalog) {
    errors.agreementCode = "unknownAgreement";
    return undefined;
  }
  if (!hasRuleSet(code.value)) {
    errors.agreementCode = "agreementNotAvailable";
    return undefined;
  }
  return code.value;
}

export function validateJob(store: MockStore, body: unknown): Result<ValidJobInput> {
  if (!isRequestBody(body)) {
    return fail("validationFailed", "The request body must be an object.");
  }

  const errors: JobFieldErrors = {};
  const workplace = validateText(body, "workplace", errors);
  const position = validateText(body, "position", errors);
  const agreementCode = validateAgreement(store, body, errors);

  if (workplace === undefined || position === undefined || agreementCode === undefined) {
    return fail("validationFailed", "The job is not valid.", { fieldErrors: errors });
  }
  return ok({ workplace, position, agreementCode });
}
