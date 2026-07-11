import { AlertTriangle, Database, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface DataStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function DataState({
  title,
  description,
  icon,
  action,
  className,
}: DataStateProps) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-3 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-md border bg-muted text-muted-foreground">
        {icon ?? <Database className="size-5" />}
      </div>
      <div>
        <p className="text-sm font-medium">{title ?? t("message.empty")}</p>
        {description ? (
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <DataState
      className={className}
      icon={<LoaderCircle className="size-5 animate-spin" />}
      title={t("message.loading")}
    />
  );
}

export function ErrorState({
  error,
  retry,
  className,
}: {
  error?: unknown;
  retry?: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <DataState
      className={className}
      icon={<AlertTriangle className="size-5 text-destructive" />}
      title={t("message.error")}
      description={error instanceof Error ? error.message : undefined}
      action={
        retry ? (
          <Button variant="outline" size="sm" onClick={retry}>
            {t("action.retry")}
          </Button>
        ) : undefined
      }
    />
  );
}
