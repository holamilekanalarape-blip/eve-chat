import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Composer } from "@/components/eve/composer";
import { MessageList } from "@/components/eve/messages";
import { streamReply, takeSend } from "@/components/eve/turn";
import { useChatStore } from "@/lib/chat/store";

export function Thread({ chatId }: { chatId: string }) {
  const chat = useChatStore((state) => state.chats.find((item) => item.id === chatId));
  const hydrated = useChatStore((state) => state.hydrated);
  const appendUser = useChatStore((state) => state.appendUser);
  const dropMessage = useChatStore((state) => state.dropMessage);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stick = useRef(true);

  async function run() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setStatus(null);
    try {
      await streamReply(chatId, controller.signal, setStatus);
    } finally {
      if (abortRef.current === controller) {
        setBusy(false);
        setStatus(null);
      }
    }
  }

  useEffect(() => {
    if (!hydrated || !chat) return;
    const token = window.setTimeout(() => {
      if (!takeSend(chatId)) return;
      void run();
    }, 0);
    return () => window.clearTimeout(token);
    // First send is keyed by the chat id. Strict mode clears the timer before it fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, chatId, chat?.id]);

  useEffect(() => {
    const node = scroller.current;
    if (!node || !stick.current) return;
    node.scrollTop = node.scrollHeight;
  }, [chat?.messages, busy, status]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, [chatId]);

  if (!hydrated) {
    return (
      <div className="flex min-h-0 flex-1 flex-col px-4">
        <div className="mx-auto w-full max-w-3xl flex-1 space-y-4 py-8">
          <div className="ml-auto h-12 w-2/3 rounded-2xl bg-muted" />
          <div className="h-24 w-full rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-lg font-semibold">This chat isn't on this device</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          History stays in the browser that created it.
        </p>
        <Link to="/" className="inline-flex h-11 items-center rounded-full bg-primary px-4 text-sm text-primary-foreground">
          New chat
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scroller}
        className="scroll-thin min-h-0 flex-1 overflow-y-auto"
        onScroll={(event) => {
          const node = event.currentTarget;
          stick.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
        }}
      >
        <MessageList
          messages={chat.messages}
          streaming={busy}
          status={status}
          onRetry={() => {
            const last = chat.messages[chat.messages.length - 1];
            if (last?.role === "assistant") dropMessage(chatId, last.id);
            void run();
          }}
        />
      </div>
      <div className="px-4 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          <Composer
            value={draft}
            onChange={setDraft}
            busy={busy}
            onStop={() => abortRef.current?.abort()}
            onSubmit={(text) => {
              appendUser(chatId, text);
              setDraft("");
              stick.current = true;
              void run();
            }}
          />
        </div>
      </div>
    </div>
  );
}
