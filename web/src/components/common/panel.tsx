import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn("overflow-hidden rounded-md border bg-card", className)}
    >
      {title || description || actions ? (
        <header className="flex min-h-14 items-center justify-between gap-4 border-b px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-semibold">{title}</h2> : null}
            {description ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
