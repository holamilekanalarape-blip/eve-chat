import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Brain, Moon, Plus, Search, Sun, Trash2, X } from "lucide-react";
import { EveMark } from "@/components/eve/mark";
import { useChatStore } from "@/lib/chat/store";
import { cn } from "@/lib/utils";

function groupLabel(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86_400_000;
  if (timestamp >= startToday) return "Today";
  if (timestamp >= startYesterday) return "Yesterday";
  if (timestamp >= startToday - 6 * 86_400_000) return "Previous 7 days";
  return "Older";
}

export function Sidebar({
  activeId,
  mobileOpen,
  desktopOpen,
  onCloseMobile,
}: {
  activeId?: string;
  mobileOpen: boolean;
  desktopOpen: boolean;
  onCloseMobile: () => void;
}) {
  const chats = useChatStore((state) => state.chats);
  const hydrated = useChatStore((state) => state.hydrated);
  const theme = useChatStore((state) => state.theme);
  const setTheme = useChatStore((state) => state.setTheme);
  const deleteChat = useChatStore((state) => state.deleteChat);
  const memory = useChatStore((state) => state.memory);
  const removeMemory = useChatStore((state) => state.removeMemory);
  const [query, setQuery] = useState("");
  const [memoryOpen, setMemoryOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle
      ? chats.filter((chat) => {
          if (chat.title.toLowerCase().includes(needle)) return true;
          return chat.messages.some((message) =>
            message.blocks.some((block) => block.kind === "text" && block.text.toLowerCase().includes(needle)),
          );
        })
      : chats;
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [chats, query]);

  const groups = useMemo(() => {
    const order = ["Today", "Yesterday", "Previous 7 days", "Older"];
    const map = new Map<string, typeof filtered>();
    for (const chat of filtered) {
      const label = groupLabel(chat.updatedAt);
      map.set(label, [...(map.get(label) ?? []), chat]);
    }
    return order.filter((label) => map.has(label)).map((label) => ({ label, chats: map.get(label) ?? [] }));
  }, [filtered]);

  return (
    <aside
      className={cn(
        "nav-slide fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-border bg-background transition-transform duration-200",
        mobileOpen && "translate-x-0",
        !mobileOpen && "max-md:pointer-events-none",
        "md:static md:translate-x-0",
        desktopOpen ? "md:w-72" : "md:w-0 md:overflow-hidden md:border-0",
      )}
    >
      <div className="flex items-center justify-between px-3 pt-3">
        <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium" onClick={onCloseMobile}>
          <EveMark className="size-5" />
          Eve
        </Link>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
          onClick={onCloseMobile}
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="px-3 pt-2">
        <Link
          to="/"
          onClick={onCloseMobile}
          className="flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
        >
          <Plus className="size-4" />
          New chat
        </Link>
      </div>

      <label className="relative mx-3 mt-3 block">
        <span className="sr-only">Search chats</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search chats"
          className="h-11 w-full rounded-lg border border-border bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div className="scroll-thin mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {!hydrated ? (
          <p className="px-2 text-sm text-muted-foreground">Loading chats…</p>
        ) : groups.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">
            {query ? "No chats match that search." : "No chats yet. Ask something to start."}
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mb-4">
              <h2 className="px-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground">{group.label}</h2>
              <ul className="space-y-0.5">
                {group.chats.map((chat) => {
                  const active = chat.id === activeId;
                  return (
                    <li key={chat.id}>
                      <div
                        className={cn(
                          "group flex items-center rounded-lg pr-1",
                          active ? "bg-muted text-foreground" : "hover:bg-muted",
                        )}
                      >
                        <Link
                          to="/chat/$id"
                          params={{ id: chat.id }}
                          onClick={onCloseMobile}
                          className="min-w-0 flex-1 px-2 py-2.5"
                        >
                          <span className="block truncate text-sm">{chat.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
                          </span>
                        </Link>
                        <button
                          type="button"
                          className="grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-100 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                          aria-label={`Delete ${chat.title}`}
                          onClick={() => {
                            deleteChat(chat.id);
                            if (active) void navigate({ to: "/" });
                          }}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      <div className="space-y-2 border-t border-border p-3">
        <button
          type="button"
          onClick={() => setMemoryOpen(true)}
          className="flex h-11 w-full items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted"
        >
          <Brain className="size-4" />
          Memory
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">{memory.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-11 w-full items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <p className="px-2 text-xs leading-relaxed text-muted-foreground">
          Chats and memory stay in this browser.
        </p>
      </div>

      {memoryOpen ? (
        <div className="absolute inset-0 z-10 flex flex-col bg-background">
          <div className="flex items-center justify-between px-3 pt-3">
            <h2 className="px-2 text-sm font-medium">Memory</h2>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-lg hover:bg-muted"
              onClick={() => setMemoryOpen(false)}
              aria-label="Close memory"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="px-5 text-sm text-muted-foreground">
            Facts Eve keeps for later chats. Ask it to remember or forget something.
          </p>
          <ul className="scroll-thin mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-4">
            {memory.length === 0 ? (
              <li className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                Nothing saved yet.
              </li>
            ) : (
              memory.map((fact) => (
                <li key={fact} className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2">
                  <p className="min-w-0 flex-1 py-1 text-sm">{fact}</p>
                  <button
                    type="button"
                    className="grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
                    aria-label={`Forget ${fact}`}
                    onClick={() => removeMemory(fact)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
