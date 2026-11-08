import { da } from "@/texts/da";
import type { FieldErrorCode } from "./fieldErrorCode";
import type { FieldErrors } from "./result";

// Oversætter API'ets fejlkoder pr. felt til dansk tekst ved feltet.

function isFieldErrorCode(code: string): code is FieldErrorCode {
  return Object.hasOwn(da.fieldErrors, code);
}

export function fieldErrorText(code: string | undefined): string | undefined {
  if (code === undefined) {
    return undefined;
  }
  if (!isFieldErrorCode(code)) {
    return da.fieldErrors.invalidFormat;
  }
  return da.fieldErrors[code];
}

/** API-feltnavn → formularens feltnavn. Felter, der ikke findes i formularen, udelades. */
export function mapFieldErrors<TField extends string>(
  fieldErrors: FieldErrors | undefined,
  apiToFormField: Readonly<Record<string, TField>>,
): Partial<Record<TField, string>> {
  const formErrors: Partial<Record<TField, string>> = {};
  if (fieldErrors === undefined) {
    return formErrors;
  }
  for (const [apiField, code] of Object.entries(fieldErrors)) {
    const formField = apiToFormField[apiField];
    const text = fieldErrorText(code);
    if (formField === undefined || text === undefined) {
      continue;
    }
    formErrors[formField] = text;
  }
  return formErrors;
}
