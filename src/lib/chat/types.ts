export type WeatherBlock = {
  id: string;
  kind: "weather";
  city: string;
  tempC: number;
  condition: string;
};

export type MemoryBlock = {
  id: string;
  kind: "memory";
  action: "save" | "forget";
  text: string;
  ok: boolean;
};

export type TextBlock = {
  id: string;
  kind: "text";
  text: string;
};

export type Block = TextBlock | WeatherBlock | MemoryBlock;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  blocks: Block[];
  error?: string;
};

export type Chat = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

export function titleFromPrompt(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 48) return clean || "New chat";
  return `${clean.slice(0, 47).trimEnd()}…`;
}

export function messageText(message: ChatMessage) {
  return message.blocks
    .map((block) => {
      if (block.kind === "text") return block.text;
      if (block.kind === "weather") {
        return `(Sample weather for ${block.city}: ${block.tempC}°C, ${block.condition}. Not live data.)`;
      }
      if (!block.ok) return `(Memory was not changed: ${block.text})`;
      return block.action === "save"
        ? `(Saved memory: ${block.text})`
        : `(Forgot memories matching “${block.text}”.)`;
    })
    .filter(Boolean)
    .join("\n\n");
}
