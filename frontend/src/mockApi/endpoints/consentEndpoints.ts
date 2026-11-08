import { fail, ok, type Result } from "@/shared/result";
import type { ConsentsDto, SicknessConsentChangedDto } from "../apiTypes";
import { isRequestBody, readBooleanField } from "../validation/requestFields";
import type { MockRequestContext } from "./mockRequest";

// GET /consents og PUT /consents/sickness.
// Trækkes samtykket til sygdom tilbage, slettes alle sygdomsmarkeringer.
// (Bekræftelsesdialogen ligger i appen, før kaldet sendes.)

export function getConsents({ store }: MockRequestContext): Result<ConsentsDto> {
  return ok({ sicknessConsent: store.consents.sickness });
}

export function setSicknessConsent({
  store,
  body,
}: MockRequestContext): Result<SicknessConsentChangedDto> {
  if (!isRequestBody(body)) {
    return fail("validationFailed", "The request body must be an object.");
  }
  const granted = readBooleanField(body, "granted");
  if (granted.status === "missing") {
    return fail("validationFailed", "The consent is required.", {
      fieldErrors: { granted: "required" },
    });
  }
  if (granted.status === "invalid") {
    return fail("validationFailed", "The consent must be true or false.", {
      fieldErrors: { granted: "invalidFormat" },
    });
  }

  store.consents.sickness = granted.value;
  if (granted.value) {
    return ok({ sicknessConsent: true, removedSickMarkings: 0 });
  }

  let removedSickMarkings = 0;
  for (const shift of store.shifts) {
    if (!shift.isSick) {
      continue;
    }
    shift.isSick = false;
    removedSickMarkings += 1;
  }
  return ok({ sicknessConsent: false, removedSickMarkings });
}
