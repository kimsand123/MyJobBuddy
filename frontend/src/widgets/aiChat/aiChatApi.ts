import { z } from "zod";
import type { ApiClient } from "@/shared/apiClient";
import { requestData } from "@/shared/apiRequest";
import {
  chatAnswerSchema,
  chatQuestionSchema,
  jobSchema,
  profileSchema,
  subscriptionSchema,
  type ChatAnswerData,
  type ChatQuestionData,
  type JobData,
  type ProfileData,
  type SubscriptionData,
} from "@/shared/apiSchemas";
import type { Result } from "@/shared/result";

// Model for AI-chatten: spørgsmål, svar, forbrug og de data, der vises i ConsentSheet.

export function fetchChatQuestions(
  apiClient: ApiClient,
  signal: AbortSignal,
): Promise<Result<ChatQuestionData[]>> {
  return requestData(
    apiClient,
    { method: "GET", path: "/chat/questions", signal },
    z.array(chatQuestionSchema),
  );
}

/** Ét spørgsmål, også opfølgninger, der ikke er blandt forslagene. */
export function fetchChatQuestion(
  apiClient: ApiClient,
  questionId: string,
  signal: AbortSignal,
): Promise<Result<ChatQuestionData>> {
  const path = `/chat/questions/${encodeURIComponent(questionId)}`;
  return requestData(apiClient, { method: "GET", path, signal }, chatQuestionSchema);
}

export function fetchChatAnswer(
  apiClient: ApiClient,
  questionId: string,
  signal: AbortSignal,
): Promise<Result<ChatAnswerData>> {
  const path = `/chat/questions/${encodeURIComponent(questionId)}/answer`;
  return requestData(apiClient, { method: "GET", path, signal }, chatAnswerSchema);
}

export function fetchSubscription(
  apiClient: ApiClient,
  signal: AbortSignal,
): Promise<Result<SubscriptionData>> {
  return requestData(
    apiClient,
    { method: "GET", path: "/subscription", signal },
    subscriptionSchema,
  );
}

export function fetchProfile(
  apiClient: ApiClient,
  signal: AbortSignal,
): Promise<Result<ProfileData>> {
  return requestData(apiClient, { method: "GET", path: "/profile", signal }, profileSchema);
}

export function fetchJobs(apiClient: ApiClient, signal: AbortSignal): Promise<Result<JobData[]>> {
  return requestData(apiClient, { method: "GET", path: "/jobs", signal }, z.array(jobSchema));
}
