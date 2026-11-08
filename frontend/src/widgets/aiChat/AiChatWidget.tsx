import { useRef, type ReactElement } from "react";
import { useNotImplemented } from "@/app/notImplemented/useNotImplemented";
import { AiDisclaimer } from "@/components/AiDisclaimer";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { ConsentSheet } from "@/components/ConsentSheet";
import { ErrorState } from "@/components/ErrorState";
import { EscalationCard } from "@/components/EscalationCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { SuggestedQuestionChips } from "@/components/SuggestedQuestionChips";
import { useReturnFocus } from "@/shared/useReturnFocus";
import { da } from "@/texts/da";
import { useAiChatWidget } from "./useAiChatWidget";

// View for AI: disclaimer i boks, samtalen, forslag til spørgsmål og fritekstfeltet.
// "Del min sag" åbner ConsentSheet; selve delingen og fritekst er ikke bygget.
// Et spørgsmål fra "Spørg AI" i løntjekket står øverst i samtalen og besvares med det samme.

export function AiChatWidget(): ReactElement {
  const chat = useAiChatWidget();
  const showNotImplemented = useNotImplemented();
  const consentFocus = useReturnFocus();
  const answerElements = useRef(new Map<string, HTMLDivElement>());

  if (chat.status === "loading") {
    return <LoadingSkeleton variant="text" rows={3} label={da.ai.loadingLabel} />;
  }
  if (chat.status === "error") {
    return <ErrorState error={chat.error} onRetry={chat.retry} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <AiDisclaimer boxed />

      <section aria-label={da.ai.conversation} aria-live="polite" className="flex flex-col gap-3">
        <ChatBubble from="ai">{da.ai.welcome}</ChatBubble>
        {chat.conversation.map((entry) => (
          <div key={entry.key} className="flex flex-col gap-3">
            <ChatBubble from="user">{entry.question}</ChatBubble>
            {entry.answer.status === "loading" && <ChatBubble from="ai" typing />}
            {entry.answer.status === "error" && (
              <ChatBubble from="ai">{entry.answer.text}</ChatBubble>
            )}
            {entry.answer.status === "ready" && (
              // Svaret kan få fokus (tabIndex -1), så fokus har et sted at lande, når
              // henvisningen under det lukkes med "Ikke nu".
              <div
                tabIndex={-1}
                ref={(element) => {
                  if (element === null) {
                    answerElements.current.delete(entry.key);
                    return;
                  }
                  answerElements.current.set(entry.key, element);
                }}
                className="flex flex-col gap-3 rounded-xl"
              >
                <ChatBubble from="ai" source={entry.answer.source}>
                  {entry.answer.text}
                </ChatBubble>
                <div className="pl-10">
                  <AiDisclaimer />
                </div>
              </div>
            )}
            {entry.showEscalation && (
              <EscalationCard
                text={da.ai.escalation.text}
                onShare={(event) => {
                  consentFocus.remember(event.currentTarget);
                  chat.openConsentSheet(entry.key);
                }}
                onLater={() => {
                  // Fokus flyttes til svaret, før kortet (og knappen) forsvinder.
                  answerElements.current.get(entry.key)?.focus();
                  chat.dismissEscalation(entry.key);
                }}
              />
            )}
          </div>
        ))}
      </section>

      <SuggestedQuestionChips
        questions={chat.questions}
        disabled={chat.isAnswering}
        onSelect={chat.ask}
      />

      <ChatInput
        value={chat.draft}
        remaining={chat.remaining}
        total={chat.total}
        onChange={chat.setDraft}
        onSend={showNotImplemented}
      />

      <ConsentSheet
        open={chat.consentSheet.open}
        recipient={chat.consentSheet.recipient}
        shared={chat.consentSheet.shared}
        notShared={chat.consentSheet.notShared}
        onConfirm={showNotImplemented}
        onCancel={chat.closeConsentSheet}
        onCloseAutoFocus={consentFocus.restore}
      />
    </div>
  );
}
