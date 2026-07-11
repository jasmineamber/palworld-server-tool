import { Activity, Clock3, Frame, MapPinned, UsersRound } from "lucide-react";

import { StatusDot } from "@/components/common/status-dot";
import { formatDuration } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { ServerInfo, ServerMetrics } from "@/types/api";

function Readout({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="flex min-w-[132px] items-center gap-3 border-r px-4 last:border-r-0 sm:min-w-[150px]">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium uppercase text-muted-foreground">
          {label}
        </p>
        <p className="font-data mt-0.5 truncate text-sm font-semibold">
          {value}
          {suffix ? (
            <span className="ml-1 text-[10px] font-normal text-muted-foreground">
              {suffix}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export function TelemetryStrip({
  server,
  metrics,
  online,
}: {
  server?: ServerInfo;
  metrics?: ServerMetrics;
  online: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="telemetry-grid flex h-[58px] min-w-0 border-b bg-background/92 backdrop-blur-sm">
      <div className="flex min-w-[220px] items-center gap-3 border-r px-4 lg:min-w-[280px] lg:px-5">
        <StatusDot online={online} pulse />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {server?.name || "Palworld"}
          </p>
          <p className="font-data truncate text-[10px] uppercase text-muted-foreground">
            {online ? t("status.online") : t("status.offline")} ·{" "}
            {server?.version || "--"}
          </p>
        </div>
      </div>
      <div className="scrollbar-thin flex min-w-0 flex-1 overflow-x-auto">
        <Readout
          icon={Activity}
          label={t("metric.fps")}
          value={metrics?.server_fps ?? "--"}
        />
        <Readout
          icon={UsersRound}
          label={t("metric.players")}
          value={`${metrics?.current_player_num ?? "--"}/${metrics?.max_player_num ?? "--"}`}
        />
        <Readout
          icon={Frame}
          label={t("metric.frameTime")}
          value={metrics?.server_frame_time ?? "--"}
          suffix="ms"
        />
        <Readout
          icon={Clock3}
          label={t("metric.uptime")}
          value={formatDuration(metrics?.uptime)}
        />
        <Readout
          icon={MapPinned}
          label={t("metric.days")}
          value={metrics?.days ?? "--"}
        />
      </div>
    </div>
  );
}
