// Navigation til AI-chatten med et spørgsmål, der skal stilles med det samme.
// Kun spørgsmålets id sendes (i history state, ikke i URL'en) – aldrig personoplysninger.

export type AskAiNavigationState = {
  askQuestionId: string;
};

export function askAiNavigationState(questionId: string): AskAiNavigationState {
  return { askQuestionId: questionId };
}

/** Spørgsmålets id fra history state, eller undefined hvis der ikke er et (gyldigt). */
export function readAskQuestionId(state: unknown): string | undefined {
  if (typeof state !== "object" || state === null || !("askQuestionId" in state)) {
    return undefined;
  }
  const questionId = state.askQuestionId;
  if (typeof questionId !== "string" || questionId === "") {
    return undefined;
  }
  return questionId;
}
