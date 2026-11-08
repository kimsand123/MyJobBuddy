// Fejlkoder pr. felt, som API'et sender i fieldErrors ved validationFailed.
// Frontenden oversætter koden til dansk via texts/da.ts; API'ets engelske besked vises aldrig.

export type FieldErrorCode =
  | "required"
  | "invalidFormat"
  | "tooLong"
  | "endNotAfterStart"
  | "pauseOutOfRange"
  | "pauseNotShorterThanShift"
  | "overlapsExistingShift"
  | "unknownJob"
  | "unknownAgreement"
  | "agreementNotAvailable";
