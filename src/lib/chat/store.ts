import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Block, Chat, ChatMessage, MemoryBlock, TripBlock, WeatherBlock } from "@/lib/chat/types";
import { titleFromPrompt } from "@/lib/chat/types";

const MAX_CHATS = 40;

type Theme = "light" | "dark";

type ChatState = {
  chats: Chat[];
  memory: string[];
  theme: Theme;
  hydrated: boolean;
  setHydrated: () => void;
  setTheme: (theme: Theme) => void;
  setMemory: (facts: string[]) => void;
  removeMemory: (fact: string) => void;
  createChat: (text: string) => string;
  appendUser: (chatId: string, text: string) => void;
  beginAssistant: (chatId: string) => string;
  pushText: (chatId: string, messageId: string, delta: string) => void;
  pushWeather: (chatId: string, messageId: string, weather: Omit<WeatherBlock, "id" | "kind">) => void;
  pushTrip: (chatId: string, messageId: string, trip: Omit<TripBlock, "id" | "kind">) => void;
  pushMemory: (chatId: string, messageId: string, memory: Omit<MemoryBlock, "id" | "kind">) => void;
  setMessageError: (chatId: string, messageId: string, error: string | undefined) => void;
  dropMessage: (chatId: string, messageId: string) => void;
  renameChat: (chatId: string, title: string) => void;
  deleteChat: (chatId: string) => void;
};

function touch(chat: Chat, messages: ChatMessage[]): Chat {
  return { ...chat, messages, updatedAt: Date.now() };
}

function mapMessage(
  chat: Chat,
  messageId: string,
  update: (message: ChatMessage) => ChatMessage,
): Chat {
  return touch(
    chat,
    chat.messages.map((message) => (message.id === messageId ? update(message) : message)),
  );
}

function appendBlock(blocks: Block[], block: Block): Block[] {
  return [...blocks, block];
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chats: [],
      memory: [],
      theme: "dark",
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setTheme: (theme) => set({ theme }),
      setMemory: (facts) => set({ memory: facts.slice(0, 24) }),
      removeMemory: (fact) =>
        set((state) => ({ memory: state.memory.filter((item) => item !== fact) })),
      createChat: (text) => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const message: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          blocks: [{ id: crypto.randomUUID(), kind: "text", text }],
        };
        const chat: Chat = {
          id,
          title: titleFromPrompt(text),
          createdAt: now,
          updatedAt: now,
          messages: [message],
        };
        set((state) => ({ chats: [chat, ...state.chats].slice(0, MAX_CHATS) }));
        return id;
      },
      appendUser: (chatId, text) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? touch(chat, [
                  ...chat.messages,
                  {
                    id: crypto.randomUUID(),
                    role: "user",
                    blocks: [{ id: crypto.randomUUID(), kind: "text", text }],
                  },
                ])
              : chat,
          ),
        })),
      beginAssistant: (chatId) => {
        const id = crypto.randomUUID();
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? touch(chat, [...chat.messages, { id, role: "assistant", blocks: [] }])
              : chat,
          ),
        }));
        return id;
      },
      pushText: (chatId, messageId, delta) =>
        set((state) => ({
          chats: state.chats.map((chat) => {
            if (chat.id !== chatId) return chat;
            return mapMessage(chat, messageId, (message) => {
              const last = message.blocks[message.blocks.length - 1];
              if (last?.kind === "text") {
                const blocks = message.blocks.slice(0, -1);
                blocks.push({ ...last, text: last.text + delta });
                return { ...message, blocks };
              }
              return {
                ...message,
                blocks: appendBlock(message.blocks, {
                  id: crypto.randomUUID(),
                  kind: "text",
                  text: delta,
                }),
              };
            });
          }),
        })),
      pushWeather: (chatId, messageId, weather) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? mapMessage(chat, messageId, (message) => ({
                  ...message,
                  blocks: appendBlock(message.blocks, {
                    id: crypto.randomUUID(),
                    kind: "weather",
                    ...weather,
                  }),
                }))
              : chat,
          ),
        })),
      pushTrip: (chatId, messageId, trip) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? mapMessage(chat, messageId, (message) => ({
                  ...message,
                  blocks: appendBlock(message.blocks, {
                    id: crypto.randomUUID(),
                    kind: "trip",
                    ...trip,
                  }),
                }))
              : chat,
          ),
        })),
      pushMemory: (chatId, messageId, memory) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? mapMessage(chat, messageId, (message) => ({
                  ...message,
                  blocks: appendBlock(message.blocks, {
                    id: crypto.randomUUID(),
                    kind: "memory",
                    ...memory,
                  }),
                }))
              : chat,
          ),
        })),
      setMessageError: (chatId, messageId, error) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? mapMessage(chat, messageId, (message) => ({ ...message, error }))
              : chat,
          ),
        })),
      dropMessage: (chatId, messageId) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? touch(
                  chat,
                  chat.messages.filter((message) => message.id !== messageId),
                )
              : chat,
          ),
        })),
      renameChat: (chatId, title) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, title: title.trim() || chat.title } : chat,
          ),
        })),
      deleteChat: (chatId) =>
        set((state) => ({ chats: state.chats.filter((chat) => chat.id !== chatId) })),
    }),
    {
      name: "eve-chat",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        chats: state.chats,
        memory: state.memory,
        theme: state.theme,
      }),
      onRehydrateStorage: () => () => {
        useChatStore.setState({ hydrated: true });
      },
      skipHydration: true,
    },
  ),
);
