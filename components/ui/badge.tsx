import { cn } from "@/lib/utils";

const urgencyStyles: Record<string, string> = {
  critical: "bg-red-500/15 text-red-300 border-red-500/30",
  high:     "bg-orange-500/15 text-orange-300 border-orange-500/30",
  normal:   "bg-zinc-500/15 text-zinc-300 border-zinc-600/30",
  low:      "bg-zinc-800 text-zinc-500 border-zinc-700/50",
};

const priorityStyles: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-300 border-red-500/30",
  high:   "bg-orange-500/15 text-orange-300 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  low:    "bg-zinc-800 text-zinc-500 border-zinc-700/50",
};

export function Badge({
  children,
  urgency,
  priority,
  className,
}: {
  children: React.ReactNode;
  urgency?: string;
  priority?: string;
  className?: string;
}) {
  const style = urgency
    ? urgencyStyles[urgency]
    : priority
    ? priorityStyles[priority]
    : "bg-zinc-800 text-zinc-400 border-zinc-700";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        style,
        className,
      )}
    >
      {children}
    </span>
  );
}
