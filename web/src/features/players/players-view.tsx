import { lazy, Suspense, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowRight,
  CircleUserRound,
  MapPin,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";

import { ErrorState, LoadingState } from "@/components/common/data-state";
import { SectionHeader } from "@/components/common/section-header";
import { StatusDot } from "@/components/common/status-dot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOnlinePlayers, usePlayers } from "@/hooks/use-server-data";
import {
  formatCoordinate,
  formatRelativeTime,
  isRecentlyOnline,
} from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { PlayerSummary } from "@/types/api";

const PlayerDetailSheet = lazy(() =>
  import("@/features/players/player-detail-sheet").then((module) => ({
    default: module.PlayerDetailSheet,
  })),
);

type SortMode = "last_online" | "level";

export default function PlayersView() {
  const { t } = useI18n();
  const { openLogin } = useOutletContext<{ openLogin: () => void }>();
  const playersQuery = usePlayers();
  const onlineQuery = useOnlinePlayers();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("last_online");

  const selectedUid = searchParams.get("player");
  const onlineByUid = useMemo(
    () =>
      new Map(
        (onlineQuery.data ?? []).map((player) => [player.player_uid, player]),
      ),
    [onlineQuery.data],
  );

  const players = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const merged = (playersQuery.data ?? []).map((player) => ({
      ...player,
      ...onlineByUid.get(player.player_uid),
    }));
    return merged
      .filter((player) => {
        const online =
          onlineByUid.has(player.player_uid) ||
          isRecentlyOnline(player.last_online);
        if (onlineOnly && !online) return false;
        if (!normalized) return true;
        return [
          player.nickname,
          player.account_name,
          player.player_uid,
          player.user_id,
          player.steam_id,
        ].some((value) => value?.toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        if (sortMode === "level") return b.level - a.level;
        return (
          new Date(b.last_online).getTime() - new Date(a.last_online).getTime()
        );
      });
  }, [onlineByUid, onlineOnly, playersQuery.data, search, sortMode]);

  const selectPlayer = (player: PlayerSummary) => {
    const next = new URLSearchParams(searchParams);
    next.set("player", player.player_uid);
    setSearchParams(next);
  };

  const closeDetail = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("player");
    setSearchParams(next, { replace: true });
  };

  if (playersQuery.isPending) return <LoadingState />;
  if (playersQuery.isError) {
    return (
      <ErrorState
        error={playersQuery.error}
        retry={() => void playersQuery.refetch()}
      />
    );
  }

  return (
    <div>
      <SectionHeader
        eyebrow="DIRECTORY / PLAYERS"
        title={t("players.title")}
        description={t("players.subtitle")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void playersQuery.refetch();
              void onlineQuery.refetch();
            }}
          >
            <RefreshCw /> {t("action.refresh")}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div className="relative min-w-0 flex-1 sm:max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("players.search")}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={onlineOnly} onCheckedChange={setOnlineOnly} />
            {t("players.onlineOnly")}
          </label>
          <Select
            value={sortMode}
            onValueChange={(value) => setSortMode(value as SortMode)}
          >
            <SelectTrigger className="w-[170px]">
              <ArrowDownAZ />
              <SelectValue placeholder={t("players.sort")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_online">
                {t("players.sortLastOnline")}
              </SelectItem>
              <SelectItem value="level">{t("players.sortLevel")}</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="font-data">
            {players.length}
          </Badge>
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14" />
              <TableHead>{t("nav.players")}</TableHead>
              <TableHead>{t("players.account")}</TableHead>
              <TableHead className="w-24">{t("players.level")}</TableHead>
              <TableHead>{t("players.connection")}</TableHead>
              <TableHead>{t("players.location")}</TableHead>
              <TableHead>{t("players.lastOnline")}</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => {
              const online =
                onlineByUid.has(player.player_uid) ||
                isRecentlyOnline(player.last_online);
              return (
                <TableRow
                  key={player.player_uid}
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => selectPlayer(player)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ")
                      selectPlayer(player);
                  }}
                >
                  <TableCell>
                    <div className="flex size-8 items-center justify-center rounded-md border bg-muted">
                      <CircleUserRound className="size-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusDot online={online} />
                      <span className="font-medium">
                        {player.nickname || "--"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{player.account_name || "--"}</p>
                    <p className="font-data max-w-[220px] truncate text-[10px] text-muted-foreground">
                      {player.user_id || player.steam_id || player.player_uid}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Lv.{player.level}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-data text-xs">
                      {player.ping ? `${player.ping.toFixed(1)} ms` : "--"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-data text-xs text-muted-foreground">
                      {formatCoordinate(player.location_x)},{" "}
                      {formatCoordinate(player.location_y)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelativeTime(player.last_online)}
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y md:hidden">
        {players.map((player) => {
          const online =
            onlineByUid.has(player.player_uid) ||
            isRecentlyOnline(player.last_online);
          return (
            <button
              key={player.player_uid}
              type="button"
              onClick={() => selectPlayer(player)}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusDot online={online} />
                  <span className="truncate font-medium">
                    {player.nickname || player.account_name}
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    Lv.{player.level}
                  </Badge>
                </div>
                <p className="font-data mt-1 truncate text-[11px] text-muted-foreground">
                  {player.user_id || player.player_uid}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {formatCoordinate(player.location_x)},{" "}
                    {formatCoordinate(player.location_y)}
                  </span>
                  <span>{formatRelativeTime(player.last_online)}</span>
                </div>
              </div>
              <ArrowRight className="mt-1 size-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {players.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-muted-foreground">
          <UsersRound className="size-8" />
          <p className="text-sm">{t("message.empty")}</p>
        </div>
      ) : null}

      {selectedUid ? (
        <Suspense fallback={null}>
          <PlayerDetailSheet
            playerUid={selectedUid}
            onOpenChange={(open) => !open && closeDetail()}
            requestLogin={openLogin}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
