import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Composer } from "@/components/eve/composer";
import { EveMark } from "@/components/eve/mark";
import { markSend } from "@/components/eve/turn";
import { useChatStore } from "@/lib/chat/store";

const STARTERS = [
  "What is eve?",
  "Plan 3 days in Lisbon",
  "What's the weather in Lagos?",
];

export function Home() {
  const [draft, setDraft] = useState("");
  const navigate = useNavigate();
  const createChat = useChatStore((state) => state.createChat);

  function start(text: string) {
    const id = createChat(text);
    markSend(id);
    void navigate({ to: "/chat/$id", params: { id } });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <div className="w-full max-w-2xl">
          <h1 className="mb-6 flex justify-center">
            <EveMark className="size-16 sm:size-20" />
            <span className="sr-only">Eve</span>
          </h1>
          <Composer autoFocus value={draft} onChange={setDraft} onSubmit={start} />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {STARTERS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => start(prompt)}
                className="h-11 rounded-full border border-border bg-card px-4 text-sm text-foreground hover:bg-muted"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="px-4 pb-4 text-center text-xs text-muted-foreground">
        A local eve chat. History stays on this device. Weather replies are sample data.
      </p>
    </div>
  );
}
