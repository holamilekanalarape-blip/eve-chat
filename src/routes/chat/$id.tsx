import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/eve/shell";
import { Thread } from "@/components/eve/thread";
import { useChatStore } from "@/lib/chat/store";

export const Route = createFileRoute("/chat/$id")({ component: ChatRoute });

function ChatRoute() {
  const { id } = Route.useParams();
  const title = useChatStore((state) => state.chats.find((chat) => chat.id === id)?.title);
  return (
    <Shell chatId={id} title={title}>
      <Thread chatId={id} />
    </Shell>
  );
}
