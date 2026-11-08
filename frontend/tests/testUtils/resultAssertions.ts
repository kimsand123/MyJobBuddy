// Hjælpere til tests: pakker et Result ud og fejler testen med en læsbar besked, hvis udfaldet
// ikke er det forventede. Test-kode må kaste (reglen om Result gælder kun produktionskoden).
import type { Failure, Result } from "@/shared/result";

export function expectSuccess<T>(result: Result<T>): T {
  if (!result.success) {
    throw new Error(`Forventede success, men fik ${result.errorType}: ${result.message}`);
  }
  return result.data;
}

export function expectFailure(result: Result<unknown>): Failure {
  if (result.success) {
    throw new Error("Forventede en fejl, men kaldet lykkedes.");
  }
  return result;
}
