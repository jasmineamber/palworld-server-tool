import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="font-data text-[11px] font-medium uppercase text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
