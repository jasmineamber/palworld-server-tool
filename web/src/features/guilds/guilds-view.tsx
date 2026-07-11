import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Crown,
  Map,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  UsersRound,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { ErrorState, LoadingState } from "@/components/common/data-state";
import { SectionHeader } from "@/components/common/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGuilds } from "@/hooks/use-server-data";
import { formatCoordinate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Guild } from "@/types/api";

function GuildDetail({
  guild,
  onOpenChange,
}: {
  guild: Guild | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  if (!guild) return null;

  return (
    <Sheet open={Boolean(guild)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-5 py-5 text-left sm:px-6">
          <div className="flex items-start gap-4 pr-8">
            <div className="telemetry-grid flex size-12 shrink-0 items-center justify-center rounded-md border bg-muted text-primary">
              <Shield className="size-6" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate text-xl">{guild.name}</SheetTitle>
              <SheetDescription className="mt-1">
                {t("guilds.level")} {guild.base_camp_level} ·{" "}
                {guild.players.length} {t("guilds.members")}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 p-5 sm:p-6">
            <div className="grid overflow-hidden rounded-md border sm:grid-cols-3">
              <div className="border-b p-4 sm:border-b-0 sm:border-r">
                <Building2 className="size-4 text-primary" />
                <p className="font-data mt-3 text-2xl font-semibold">
                  {guild.base_camp_level}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("guilds.level")}
                </p>
              </div>
              <div className="border-b p-4 sm:border-b-0 sm:border-r">
                <UsersRound className="size-4 text-[var(--signal)]" />
                <p className="font-data mt-3 text-2xl font-semibold">
                  {guild.players.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("guilds.members")}
                </p>
              </div>
              <div className="p-4">
                <MapPin className="size-4 text-[var(--warning)]" />
                <p className="font-data mt-3 text-2xl font-semibold">
                  {guild.base_camp.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("guilds.camps")}
                </p>
              </div>
            </div>

            <section>
              <h3 className="mb-2 text-sm font-semibold">
                {t("guilds.members")}
              </h3>
              <div className="divide-y rounded-md border">
                {guild.players.map((player) => {
                  const master = player.player_uid === guild.admin_player_uid;
                  return (
                    <Link
                      key={player.player_uid}
                      to={`/players?player=${encodeURIComponent(player.player_uid)}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/55"
                    >
                      <div className="flex size-8 items-center justify-center rounded-md border bg-muted">
                        {master ? (
                          <Crown className="size-4 text-[var(--warning)]" />
                        ) : (
                          <UsersRound className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {player.nickname}
                        </p>
                        <p className="font-data truncate text-[10px] text-muted-foreground">
                          {player.player_uid}
                        </p>
                      </div>
                      {master ? (
                        <Badge variant="secondary">{t("guilds.master")}</Badge>
                      ) : null}
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t("guilds.camps")}</h3>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/map">
                    <Map /> {t("nav.map")}
                  </Link>
                </Button>
              </div>
              {guild.base_camp.length ? (
                <div className="divide-y rounded-md border">
                  {guild.base_camp.map((camp, index) => (
                    <div
                      key={camp.id || `${camp.location_x}-${camp.location_y}`}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
                    >
                      <MapPin className="size-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Base {index + 1}</p>
                        <p className="font-data text-[10px] text-muted-foreground">
                          X {formatCoordinate(camp.location_x)} / Y{" "}
                          {formatCoordinate(camp.location_y)}
                        </p>
                      </div>
                      <Badge variant="outline">R {Math.round(camp.area)}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-28 items-center justify-center rounded-md border text-sm text-muted-foreground">
                  {t("message.empty")}
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default function GuildsView() {
  const { t } = useI18n();
  const guildsQuery = useGuilds();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const selectedGuildId = searchParams.get("guild");

  const guilds = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return (guildsQuery.data ?? []).filter((guild) => {
      if (!normalized) return true;
      return (
        guild.name.toLowerCase().includes(normalized) ||
        guild.players.some((player) =>
          player.nickname.toLowerCase().includes(normalized),
        )
      );
    });
  }, [guildsQuery.data, search]);

  const selectedGuild =
    guildsQuery.data?.find(
      (guild) => guild.admin_player_uid === selectedGuildId,
    ) ?? null;

  const selectGuild = (guild: Guild) => {
    const next = new URLSearchParams(searchParams);
    next.set("guild", guild.admin_player_uid);
    setSearchParams(next);
  };

  const closeDetail = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("guild");
    setSearchParams(next, { replace: true });
  };

  if (guildsQuery.isPending) return <LoadingState />;
  if (guildsQuery.isError) {
    return (
      <ErrorState
        error={guildsQuery.error}
        retry={() => void guildsQuery.refetch()}
      />
    );
  }

  return (
    <div>
      <SectionHeader
        eyebrow="DIRECTORY / GUILDS"
        title={t("guilds.title")}
        description={t("guilds.subtitle")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void guildsQuery.refetch()}
          >
            <RefreshCw /> {t("action.refresh")}
          </Button>
        }
      />

      <div className="flex items-center gap-3 border-b px-4 py-4 sm:px-6 lg:px-8">
        <div className="relative w-full max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`${t("action.search")} ${t("nav.guilds")}`}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="font-data">
          {guilds.length}
        </Badge>
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("guilds.name")}</TableHead>
              <TableHead className="w-36">{t("guilds.level")}</TableHead>
              <TableHead className="w-32">{t("guilds.members")}</TableHead>
              <TableHead className="w-32">{t("guilds.camps")}</TableHead>
              <TableHead>{t("guilds.master")}</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {guilds.map((guild) => {
              const master = guild.players.find(
                (player) => player.player_uid === guild.admin_player_uid,
              );
              return (
                <TableRow
                  key={guild.admin_player_uid}
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => selectGuild(guild)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ")
                      selectGuild(guild);
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-md border bg-muted text-primary">
                        <Shield className="size-4" />
                      </div>
                      <span className="font-medium">{guild.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Lv.{guild.base_camp_level}</Badge>
                  </TableCell>
                  <TableCell className="font-data">
                    {guild.players.length}
                  </TableCell>
                  <TableCell className="font-data">
                    {guild.base_camp.length}
                  </TableCell>
                  <TableCell>{master?.nickname || "--"}</TableCell>
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
        {guilds.map((guild) => (
          <button
            key={guild.admin_player_uid}
            type="button"
            onClick={() => selectGuild(guild)}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex size-10 items-center justify-center rounded-md border bg-muted text-primary">
              <Shield className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{guild.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Lv.{guild.base_camp_level} · {guild.players.length}{" "}
                {t("guilds.members")} · {guild.base_camp.length}{" "}
                {t("guilds.camps")}
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <GuildDetail
        guild={selectedGuild}
        onOpenChange={(open) => !open && closeDetail()}
      />
    </div>
  );
}
