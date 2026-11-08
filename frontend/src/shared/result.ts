// Fælles resultattype. Egen kode kaster aldrig; fejl returneres som Result<T>.

/**
 * Fejltyper. Spejler API'ets ResponseErrorType og udledes af HTTP-statuskoden:
 * 400 validationFailed, 401 unauthorized, 403 forbidden, 404 notFound, 409 conflict,
 * 500 serverError, 503 serviceUnavailable.
 * De sidste tre opstår i klienten: networkError (ingen forbindelse), aborted (forespørgslen blev
 * afbrudt via AbortSignal) og invalidResponse (svaret bestod ikke Zod-valideringen i Model).
 */
export type ErrorType =
  | "validationFailed"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "serverError"
  | "serviceUnavailable"
  | "networkError"
  | "aborted"
  | "invalidResponse";

/**
 * Fejl pr. felt: feltnavn → fejlkode (fx "required"). Bruges kun ved validationFailed,
 * så en formular kan vise den danske fejltekst ved det rigtige felt.
 */
export type FieldErrors = Partial<Record<string, string>>;

export type Success<T> = { success: true; data: T };

export type Failure = {
  success: false;
  errorType: ErrorType;
  message: string;
  traceId?: string;
  fieldErrors?: FieldErrors;
};

export type Result<T> = Success<T> | Failure;

export function ok<T>(data: T): Success<T> {
  return { success: true, data };
}

export type FailureDetails = {
  traceId?: string;
  fieldErrors?: FieldErrors;
};

export function fail(errorType: ErrorType, message: string, details?: FailureDetails): Failure {
  const failure: Failure = { success: false, errorType, message };
  if (details?.traceId !== undefined) {
    failure.traceId = details.traceId;
  }
  if (details?.fieldErrors !== undefined) {
    failure.fieldErrors = details.fieldErrors;
  }
  return failure;
}
