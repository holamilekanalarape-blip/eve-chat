import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/eve/home";
import { Shell } from "@/components/eve/shell";

export const Route = createFileRoute("/")({ component: HomeRoute });

function HomeRoute() {
  return (
    <Shell>
      <Home />
    </Shell>
  );
}
