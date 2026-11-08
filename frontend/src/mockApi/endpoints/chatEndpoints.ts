import { fail, ok, type Result } from "@/shared/result";
import type { ChatAnswerDto, ChatQuestionDto } from "../apiTypes";
import type { ChatQuestionRecord, MockStore } from "../storeTypes";
import { requirePathParam } from "./endpointHelpers";
import type { MockRequestContext } from "./mockRequest";

// GET /chat/questions (forslagene), GET /chat/questions/:questionId (ét spørgsmål, også
// opfølgninger fra løntjekket) og GET /chat/questions/:questionId/answer.
// Svarene er færdigskrevne i demoen. Forbruget af spørgsmål tælles ikke ned.

function findQuestion(
  store: MockStore,
  pathParams: Partial<Record<string, string>>,
): Result<ChatQuestionRecord> {
  const questionId = requirePathParam(pathParams, "questionId");
  if (!questionId.success) {
    return questionId;
  }
  const question = store.chatQuestions.find((candidate) => candidate.id === questionId.data);
  if (question === undefined) {
    return fail("notFound", "The question was not found.");
  }
  return ok(question);
}

export function getChatQuestions({ store }: MockRequestContext): Result<ChatQuestionDto[]> {
  return ok(
    store.chatQuestions
      .filter((question) => question.isSuggested)
      .map((question) => ({ id: question.id, text: question.question })),
  );
}

export function getChatQuestion({
  store,
  pathParams,
}: MockRequestContext): Result<ChatQuestionDto> {
  const question = findQuestion(store, pathParams);
  if (!question.success) {
    return question;
  }
  return ok({ id: question.data.id, text: question.data.question });
}

export function getChatAnswer({ store, pathParams }: MockRequestContext): Result<ChatAnswerDto> {
  const question = findQuestion(store, pathParams);
  if (!question.success) {
    return question;
  }
  return ok({
    questionId: question.data.id,
    answer: question.data.answer,
    source: question.data.source,
    referToUnion: question.data.referToUnion,
  });
}
