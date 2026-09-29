import { useEffect, useState, type ReactNode } from "react";
import { PanelLeft } from "lucide-react";
import { Sidebar } from "@/components/eve/sidebar";
import { useChatStore } from "@/lib/chat/store";

export function Shell({
  children,
  chatId,
  title,
}: {
  children: ReactNode;
  chatId?: string;
  title?: string;
}) {
  const theme = useChatStore((state) => state.theme);
  const hydrated = useChatStore((state) => state.hydrated);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, hydrated]);

  useEffect(() => {
    const unsub = useChatStore.persist.onFinishHydration(() => {
      useChatStore.setState({ hydrated: true });
    });
    void useChatStore.persist.rehydrate();
    return unsub;
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-foreground/30 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <Sidebar
        activeId={chatId}
        mobileOpen={mobileOpen}
        desktopOpen={desktopOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-1 px-2">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={desktopOpen ? "Hide sidebar" : "Show sidebar"}
            onClick={() => {
              if (window.matchMedia("(min-width: 768px)").matches) setDesktopOpen((open) => !open);
              else setMobileOpen(true);
            }}
          >
            <PanelLeft className="size-5" />
          </button>
          <p className="min-w-0 truncate text-sm font-medium">{title ?? "Eve"}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
