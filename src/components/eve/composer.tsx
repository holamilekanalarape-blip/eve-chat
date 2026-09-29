import { useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";

const LIMIT = 4000;

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  placeholder = "Ask anything...",
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onStop?: () => void;
  busy?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const tooLong = value.length > LIMIT;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = "0px";
    node.style.height = `${Math.min(node.scrollHeight, 180)}px`;
  }, [value]);

  function submit() {
    const text = value.trim();
    if (!text || busy || tooLong) return;
    onSubmit(text);
  }

  return (
    <form
      className="rounded-2xl border border-border bg-card shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label className="block">
        <span className="sr-only">Message</span>
        <textarea
          ref={ref}
          autoFocus={autoFocus}
          rows={1}
          value={value}
          placeholder={placeholder}
          disabled={busy}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          className="max-h-44 w-full resize-none bg-transparent px-4 pt-3.5 text-base leading-normal text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-70"
        />
      </label>
      <div className="flex items-center justify-between gap-3 px-3 pb-3">
        <p className={cn("text-xs text-muted-foreground", tooLong && "text-destructive")}>
          {tooLong ? `${value.length}/${LIMIT}` : "Weather is sample data · memory stays here"}
        </p>
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"
            aria-label="Stop generating"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!value.trim() || tooLong}
            className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-35"
            aria-label="Send message"
          >
            <ArrowUp className="size-5" />
          </button>
        )}
      </div>
    </form>
  );
}
