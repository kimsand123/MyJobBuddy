import type { ErrorType, Failure } from "./result";

// Fejl i en widget. TanStack Query kræver, at queryFn kaster ved fejl; ViewModel kaster derfor en
// ApiFailureError med API'ets Failure, og mapper den tilbage til en WidgetError til View.

export type WidgetError = {
  errorType: ErrorType;
  traceId: string | undefined;
};

export class ApiFailureError extends Error {
  readonly failure: Failure;

  constructor(failure: Failure) {
    super(failure.message);
    this.name = "ApiFailureError";
    this.failure = failure;
  }
}

export function failureToWidgetError(failure: Failure): WidgetError {
  return { errorType: failure.errorType, traceId: failure.traceId };
}

export function toWidgetError(error: unknown): WidgetError {
  if (error instanceof ApiFailureError) {
    return failureToWidgetError(error.failure);
  }
  return { errorType: "serverError", traceId: undefined };
}
