import { useState } from "react";
import { Check, CloudSun, Copy, Map, RotateCcw } from "lucide-react";
import { Markdown } from "@/components/eve/markdown";
import type { ChatMessage } from "@/lib/chat/types";
import { messageText } from "@/lib/chat/types";

export function MessageList({
  messages,
  streaming,
  status,
  onRetry,
}: {
  messages: ChatMessage[];
  streaming: boolean;
  status: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      {messages.map((message, index) => {
        const last = index === messages.length - 1;
        if (message.role === "user") {
          const text = message.blocks.find((block) => block.kind === "text");
          return (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-xl rounded-2xl bg-secondary px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap text-secondary-foreground">
                {text?.kind === "text" ? text.text : ""}
              </p>
            </div>
          );
        }

        const showCaret = streaming && last && !status;
        return (
          <article key={message.id} className="space-y-3" aria-live={last ? "polite" : undefined}>
            {message.blocks.map((block) => {
              if (block.kind === "weather") {
                return (
                  <div key={block.id} className="flex max-w-sm items-start gap-3 rounded-xl border border-border bg-card px-3 py-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                      <CloudSun className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{block.city}</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="tabular-nums text-foreground">{block.tempC}°C</span>
                        {" · "}
                        {block.condition}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Sample data, not live conditions.</p>
                    </div>
                  </div>
                );
              }
              if (block.kind === "trip") {
                return (
                  <section key={block.id} className="max-w-lg rounded-xl border border-border bg-card px-4 py-3">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="grid size-9 place-items-center rounded-lg bg-muted">
                        <Map className="size-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-medium">
                          {block.days} {block.days === 1 ? "day" : "days"} in {block.city}
                        </h3>
                        <p className="text-xs text-muted-foreground">A plan you can keep. It stays with this chat.</p>
                      </div>
                    </div>
                    <ol className="space-y-3">
                      {block.stops.map((stop) => (
                        <li key={stop.day} className="grid grid-cols-[auto_1fr] gap-3">
                          <span className="pt-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                            Day {stop.day}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{stop.title}</p>
                            <p className="text-sm text-muted-foreground">{stop.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              }
              if (block.kind === "memory") {
                return (
                  <p key={block.id} className="text-sm text-muted-foreground">
                    {block.ok
                      ? block.action === "save"
                        ? `Saved to memory: ${block.text}`
                        : `Forgot memories matching “${block.text}”.`
                      : block.action === "save"
                        ? "That wasn't saved. Eve won't store secrets or empty notes."
                        : "No matching memory to forget."}
                  </p>
                );
              }
              return (
                <div key={block.id}>
                  <Markdown text={block.text} />
                  {showCaret && block === message.blocks[message.blocks.length - 1] ? (
                    <span className="caret ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 bg-foreground align-middle" />
                  ) : null}
                </div>
              );
            })}
            {streaming && last && message.blocks.length === 0 ? (
              <p className="shimmer-text text-sm">{status ?? "Eve is thinking"}</p>
            ) : null}
            {streaming && last && status && message.blocks.length > 0 ? (
              <p className="shimmer-text text-sm">{status}</p>
            ) : null}
            {!streaming && last && message.error ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-destructive">{message.error}</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                  Retry
                </button>
              </div>
            ) : null}
            {!streaming && messageText(message) ? <CopyButton text={messageText(message)} /> : null}
          </article>
        );
      })}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-1 rounded-md px-1 text-xs text-muted-foreground hover:text-foreground"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
