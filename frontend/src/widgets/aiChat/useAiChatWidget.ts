import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useApiClient } from "@/app/apiClient/useApiClient";
import type { JobData, ProfileData } from "@/shared/apiSchemas";
import { readAskQuestionId } from "@/shared/askAiNavigation";
import { queryKeys } from "@/shared/queryKeys";
import type { Result } from "@/shared/result";
import type { SharedItem } from "@/shared/viewTypes";
import { ApiFailureError, toWidgetError } from "@/shared/widgetError";
import { da } from "@/texts/da";
import {
  fetchChatAnswer,
  fetchChatQuestion,
  fetchChatQuestions,
  fetchJobs,
  fetchProfile,
  fetchSubscription,
} from "./aiChatApi";
import type { AiChatState, AnswerView, ConversationEntryView } from "./aiChatTypes";

// ViewModel for AI-chatten. Et valgt forslag lægges i samtalen; svaret hentes (kort "skriver"-
// tilstand) og vises med kilde. Alvorlige sager (referToUnion) får en henvisning til fagforening.
// Kommer brugeren fra "Spørg AI" i løntjekket, stilles det medsendte spørgsmål med det samme.
// Forbruget af spørgsmål tælles ikke ned i demoen.

type AskedQuestion = {
  key: string;
  questionId: string;
  text: string;
};

const autoEntryKey = "auto";

function unwrap<T>(result: Result<T>): T {
  if (!result.success) {
    throw new ApiFailureError(result);
  }
  return result.data;
}

function sharedItems(
  profile: ProfileData | undefined,
  firstJob: JobData | undefined,
  message: string,
): SharedItem[] {
  const items: SharedItem[] = [];
  if (profile !== undefined) {
    items.push({
      label: da.ai.consentSheet.nameAndAge,
      value: da.ai.consentSheet.nameAndAgeValue(profile.firstName, profile.age),
    });
  }
  if (firstJob !== undefined) {
    items.push({
      label: da.ai.consentSheet.workplace,
      value: da.ai.consentSheet.workplaceValue(firstJob.workplace, firstJob.agreementName),
    });
  }
  items.push({
    label: da.ai.consentSheet.message,
    value: da.ai.consentSheet.messageValue(message),
  });
  return items;
}

export function useAiChatWidget(): AiChatState {
  const apiClient = useApiClient();
  const location = useLocation();
  const navigate = useNavigate();
  // Spørgsmålet fra "Spørg AI" læses én gang; bagefter ryddes history state, så det ikke stilles
  // igen ved tilbage/frem.
  const [autoQuestionId] = useState(() => readAskQuestionId(location.state));
  const [asked, setAsked] = useState<readonly AskedQuestion[]>([]);
  const [dismissedKeys, setDismissedKeys] = useState<readonly string[]>([]);
  const [consentEntryKey, setConsentEntryKey] = useState<string | undefined>(undefined);
  const [consentSheetOpen, setConsentSheetOpen] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (readAskQuestionId(location.state) === undefined) {
      return;
    }
    void navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const questionsQuery = useQuery({
    queryKey: queryKeys.chatQuestions,
    queryFn: async ({ signal }) => unwrap(await fetchChatQuestions(apiClient, signal)),
  });
  const autoQuestionQuery = useQuery({
    queryKey: queryKeys.chatQuestion(autoQuestionId ?? ""),
    queryFn: async ({ signal }) =>
      unwrap(await fetchChatQuestion(apiClient, autoQuestionId ?? "", signal)),
    enabled: autoQuestionId !== undefined,
  });
  const subscriptionQuery = useQuery({
    queryKey: queryKeys.subscription,
    queryFn: async ({ signal }) => unwrap(await fetchSubscription(apiClient, signal)),
  });
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async ({ signal }) => unwrap(await fetchProfile(apiClient, signal)),
  });
  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs,
    queryFn: async ({ signal }) => unwrap(await fetchJobs(apiClient, signal)),
  });

  const autoQuestion = autoQuestionQuery.data;
  const entries: readonly AskedQuestion[] =
    autoQuestion === undefined
      ? asked
      : [{ key: autoEntryKey, questionId: autoQuestion.id, text: autoQuestion.text }, ...asked];

  const answerQueries = useQueries({
    queries: entries.map((entry) => ({
      queryKey: queryKeys.chatAnswer(entry.questionId),
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        unwrap(await fetchChatAnswer(apiClient, entry.questionId, signal)),
    })),
  });

  if (questionsQuery.error !== null) {
    return {
      status: "error",
      error: toWidgetError(questionsQuery.error),
      retry: () => {
        void questionsQuery.refetch();
      },
    };
  }
  const questions = questionsQuery.data;
  if (questions === undefined) {
    return { status: "loading" };
  }

  const conversation: ConversationEntryView[] = entries.map((entry, index) => {
    const answerQuery = answerQueries[index];
    let answer: AnswerView = { status: "loading" };
    if (answerQuery?.error !== null && answerQuery?.error !== undefined) {
      answer = { status: "error", text: da.ai.answerFailed };
    }
    const data = answerQuery?.data;
    if (data !== undefined) {
      answer = {
        status: "ready",
        text: data.answer,
        source: data.source,
        referToUnion: data.referToUnion,
      };
    }
    return {
      key: entry.key,
      question: entry.text,
      answer,
      showEscalation:
        answer.status === "ready" && answer.referToUnion && !dismissedKeys.includes(entry.key),
    };
  });

  const consentEntry = entries.find((entry) => entry.key === consentEntryKey);

  return {
    status: "ready",
    questions: questions.map((question) => ({ id: question.id, text: question.text })),
    conversation,
    isAnswering: conversation.some((entry) => entry.answer.status === "loading"),
    remaining: subscriptionQuery.data?.questionsRemaining,
    total: subscriptionQuery.data?.questionsTotal,
    draft,
    consentSheet: {
      open: consentSheetOpen,
      recipient: da.ai.recipient,
      shared: sharedItems(profileQuery.data, jobsQuery.data?.[0], consentEntry?.text ?? ""),
      notShared: da.ai.consentSheet.notShared,
    },
    setDraft,
    ask: (questionId) => {
      const text = questions.find((question) => question.id === questionId)?.text ?? "";
      setAsked([...asked, { key: `${String(asked.length)}-${questionId}`, questionId, text }]);
    },
    dismissEscalation: (entryKey) => {
      setDismissedKeys([...dismissedKeys, entryKey]);
    },
    openConsentSheet: (entryKey) => {
      setConsentEntryKey(entryKey);
      setConsentSheetOpen(true);
    },
    closeConsentSheet: () => {
      setConsentSheetOpen(false);
    },
  };
}
