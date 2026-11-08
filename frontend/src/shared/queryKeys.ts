// Nøgler til TanStack Query. Mutationer invaliderer på de korte nøgler (fx ["shifts"]), så alle
// måneder og job opdateres – også løntjekket og Hjem, der bruger de samme nøgler.

export const queryKeys = {
  profile: ["profile"],
  subscription: ["subscription"],
  consents: ["consents"],
  agreements: ["agreements"],
  jobs: ["jobs"],
  allShifts: ["shifts"],
  shifts: (jobId: string, month: string): readonly string[] => ["shifts", jobId, month],
  shiftEstimate: (values: readonly string[]): readonly string[] => ["shiftEstimate", ...values],
  allPayChecks: ["payCheck"],
  payCheck: (jobId: string, month: string): readonly string[] => ["payCheck", jobId, month],
  chatQuestions: ["chatQuestions"],
  chatQuestion: (questionId: string): readonly string[] => ["chatQuestion", questionId],
  chatAnswer: (questionId: string): readonly string[] => ["chatAnswer", questionId],
} as const;
