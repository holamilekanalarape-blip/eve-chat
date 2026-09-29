import { cn } from "@/lib/utils";

export function EveMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 102 102"
      aria-hidden="true"
      className={cn("fill-current", className)}
    >
      <path d="M49.2813 66.9377L75.0313 34.9622H68.1395L47.9098 60.1058L42.4238 66.9377H49.2813Z" />
      <path d="M0 34.9622H42.4048V40.0704H0V34.9622Z" />
      <path d="M27.6587 48.2844H0V53.3926H27.6587V48.2844Z" />
      <path d="M27.6588 61.816H0V66.9242H27.6588V61.816Z" />
      <path d="M69.6303 34.9622H101.9V40.0704H69.6303V34.9622Z" />
      <path d="M74.2412 48.2844H101.9V53.3926H74.2412V48.2844Z" />
      <path d="M74.2411 61.816H101.9V66.9242H74.2411V61.816Z" />
    </svg>
  );
}
