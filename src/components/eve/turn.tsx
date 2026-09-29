import { useChatStore } from "@/lib/chat/store";
import { messageText } from "@/lib/chat/types";

const started = new Set<string>();

export function markSend(chatId: string) {
  sessionStorage.setItem("eve-send", chatId);
}

export function takeSend(chatId: string) {
  if (sessionStorage.getItem("eve-send") !== chatId) return false;
  if (started.has(chatId)) return false;
  started.add(chatId);
  sessionStorage.removeItem("eve-send");
  return true;
}

export async function streamReply(
  chatId: string,
  signal: AbortSignal,
  onStatus?: (text: string | null) => void,
) {
  const store = useChatStore.getState();
  const chat = store.chats.find((item) => item.id === chatId);
  if (!chat) return;

  const messages = chat.messages
    .map((message) => ({ role: message.role, content: messageText(message).trim() }))
    .filter((message) => message.content.length > 0)
    .slice(-16);

  const assistantId = store.beginAssistant(chatId);
  let sawText = false;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal,
      body: JSON.stringify({ messages, memory: store.memory }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error || "Eve couldn't reply just now.");
    }
    if (!response.body) throw new Error("Eve returned an empty reply.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";
      for (const chunk of chunks) {
        const line = chunk
          .split("\n")
          .map((item) => item.trim())
          .find((item) => item.startsWith("data:"));
        if (!line) continue;
        const data = line.slice(5).trim();
        if (!data) continue;
        const event = JSON.parse(data) as {
          type: string;
          text?: string;
          message?: string;
          city?: string;
          tempC?: number;
          condition?: string;
          action?: "save" | "forget";
          ok?: boolean;
          facts?: string[];
        };
        const live = useChatStore.getState();
        if (event.type === "text" && event.text) {
          sawText = true;
          onStatus?.(null);
          live.pushText(chatId, assistantId, event.text);
        } else if (event.type === "status" && event.text) {
          onStatus?.(event.text);
        } else if (event.type === "weather" && event.city && typeof event.tempC === "number" && event.condition) {
          live.pushWeather(chatId, assistantId, {
            city: event.city,
            tempC: event.tempC,
            condition: event.condition,
          });
        } else if (event.type === "memory" && event.action && event.text) {
          live.pushMemory(chatId, assistantId, {
            action: event.action,
            text: event.text,
            ok: Boolean(event.ok),
          });
          if (event.facts) live.setMemory(event.facts);
        } else if (event.type === "error") {
          throw new Error(event.message || "Eve couldn't reply just now.");
        }
      }
    }

    const after = useChatStore.getState().chats.find((item) => item.id === chatId);
    const assistant = after?.messages.find((message) => message.id === assistantId);
    if (!assistant || (assistant.blocks.length === 0 && !sawText)) {
      useChatStore.getState().pushText(chatId, assistantId, "Eve didn't return a reply. Try again.");
    }
  } catch (error) {
    if (signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
    const message = error instanceof Error ? error.message : "Eve couldn't reply just now.";
    useChatStore.getState().setMessageError(chatId, assistantId, message);
  }
}
