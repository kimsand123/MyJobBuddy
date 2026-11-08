import { FileSearch, Sparkles } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { da } from "@/texts/da";

// En besked i chatten: brugerens (navy, højre) eller AI'ens (hvid, venstre) med kilde.
// Mens AI'en skriver, vises tre prikker med role="status".

export type ChatBubbleProps = {
  from: "user" | "ai";
  source?: string;
  typing?: boolean;
  children?: ReactNode;
};

export function ChatBubble({
  from,
  source,
  typing = false,
  children,
}: ChatBubbleProps): ReactElement {
  const isAi = from === "ai";
  return (
    <div className={cn("flex items-end gap-2", !isAi && "justify-end")}>
      {isAi && (
        <span
          aria-hidden="true"
          className="inline-flex size-8 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Sparkles className="size-4.5" />
        </span>
      )}
      <div
        className={cn(
          "max-w-[82%] rounded-xl px-4 py-3 text-body",
          isAi
            ? "rounded-bl-sm bg-card text-foreground shadow-card"
            : "rounded-br-sm bg-navy text-navy-foreground",
        )}
      >
        <span className="sr-only">{isAi ? da.ai.aiSaid : da.ai.userSaid}</span>
        {typing ? (
          <span role="status" aria-label={da.ai.typing} className="inline-flex gap-1.5 py-1.5">
            <span className="size-2 rounded-full bg-muted-foreground motion-safe:animate-pulse" />
            <span className="size-2 rounded-full bg-muted-foreground motion-safe:animate-pulse [animation-delay:200ms]" />
            <span className="size-2 rounded-full bg-muted-foreground motion-safe:animate-pulse [animation-delay:400ms]" />
          </span>
        ) : (
          <p>{children}</p>
        )}
        {isAi && !typing && source !== undefined && (
          <span className="mt-2 flex items-center gap-1 text-[0.8125rem] leading-4 text-muted-foreground">
            <FileSearch className="size-3.5 flex-none" aria-hidden="true" />
            {source}
          </span>
        )}
      </div>
    </div>
  );
}
