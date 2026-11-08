import type { z } from "zod";
import type { ApiClient, ApiRequest } from "./apiClient";
import { fail, ok, type Result } from "./result";

// Fælles trin for alle Models: kald API'et og valider svaret med Zod.
// Fejl fra API'et (inkl. fieldErrors) sendes uændret videre.

export async function requestData<T>(
  apiClient: ApiClient,
  request: ApiRequest,
  schema: z.ZodType<T>,
): Promise<Result<T>> {
  const result = await apiClient.request(request);
  if (!result.success) {
    return result;
  }
  const parsed = schema.safeParse(result.data);
  if (!parsed.success) {
    return fail("invalidResponse", "The response did not match the expected format.");
  }
  return ok(parsed.data);
}
