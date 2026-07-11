import { cn } from "@/lib/utils";

export function StatusDot({
  online,
  pulse = false,
  className,
}: {
  online: boolean;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative flex size-2", className)} aria-hidden="true">
      {pulse && online ? (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-50" />
      ) : null}
      <span
        className={cn(
          "relative inline-flex size-2 rounded-full",
          online ? "bg-emerald-500" : "bg-destructive",
        )}
      />
    </span>
  );
}
