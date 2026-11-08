import type { SharedItem, SuggestedQuestion } from "@/shared/viewTypes";
import type { WidgetError } from "@/shared/widgetError";

// Tilstand for AI-chatten. Svarene er færdigskrevne i demoen.

export type AnswerView =
  | { status: "loading" }
  | { status: "error"; text: string }
  | { status: "ready"; text: string; source: string; referToUnion: boolean };

export type ConversationEntryView = {
  key: string;
  question: string;
  answer: AnswerView;
  /** EscalationCard vises efter svaret (alvorlig sag, ikke afvist med "Ikke nu"). */
  showEscalation: boolean;
};

export type ConsentSheetView = {
  open: boolean;
  recipient: string;
  shared: readonly SharedItem[];
  notShared: readonly string[];
};

export type AiChatState =
  | { status: "loading" }
  | { status: "error"; error: WidgetError; retry: () => void }
  | {
      status: "ready";
      questions: readonly SuggestedQuestion[];
      conversation: readonly ConversationEntryView[];
      isAnswering: boolean;
      remaining: number | undefined;
      total: number | undefined;
      draft: string;
      consentSheet: ConsentSheetView;
      setDraft: (draft: string) => void;
      ask: (questionId: string) => void;
      dismissEscalation: (entryKey: string) => void;
      openConsentSheet: (entryKey: string) => void;
      closeConsentSheet: () => void;
    };
