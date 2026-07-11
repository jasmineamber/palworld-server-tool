import { Fragment, useMemo, useState } from "react";
import { Layers3, LocateFixed, MapPinned, Minus, Plus } from "lucide-react";
import { CRS, icon, type LatLngExpression } from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useNavigate } from "react-router-dom";

import { StatusDot } from "@/components/common/status-dot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  useGuilds,
  useOnlinePlayers,
  useServerInfo,
} from "@/hooks/use-server-data";
import { formatCoordinate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import baseIconUrl from "@/assets/map/base.webp";
import bossTowerIconUrl from "@/assets/map/boss_tower.webp";
import fastTravelIconUrl from "@/assets/map/fast_travel.webp";
import playerIconUrl from "@/assets/map/player.webp";
import pointsJson from "@/assets/map/points.json";

const LANDSCAPE = {
  maxX: 349_400,
  maxY: 724_400,
  minX: -1_099_400,
  minY: -724_400,
};
const MAP_SIZE = 512;

const points = pointsJson as {
  boss_tower: [number, number][];
  fast_travel: [number, number][];
};

function toMapPosition(position: [number, number]): LatLngExpression {
  const latitude =
    -MAP_SIZE +
    (MAP_SIZE * (position[0] - LANDSCAPE.minX)) /
      (LANDSCAPE.maxX - LANDSCAPE.minX);
  const longitude =
    (MAP_SIZE * (position[1] - LANDSCAPE.minY)) /
    (LANDSCAPE.maxY - LANDSCAPE.minY);
  return [latitude, longitude];
}

function fromMapPosition(position: [number, number]) {
  const x =
    ((position[0] + MAP_SIZE) * (LANDSCAPE.maxX - LANDSCAPE.minX)) / MAP_SIZE +
    LANDSCAPE.minX;
  const y =
    (position[1] * (LANDSCAPE.maxY - LANDSCAPE.minY)) / MAP_SIZE +
    LANDSCAPE.minY;
  return [Math.round(x), Math.round(y)] as const;
}

function toMapDistance(distance: number) {
  return MAP_SIZE * (distance / (LANDSCAPE.maxX - LANDSCAPE.minX));
}

function CoordinateTracker({
  onMove,
}: {
  onMove: (position: readonly [number, number]) => void;
}) {
  useMapEvents({
    mousemove(event) {
      onMove(fromMapPosition([event.latlng.lat, event.latlng.lng]));
    },
  });
  return null;
}

function MapZoomControls() {
  const { t } = useI18n();
  const map = useMap();
  return (
    <div className="absolute bottom-4 right-4 z-[500] flex overflow-hidden rounded-md border bg-background shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-none border-r"
        onClick={() => map.zoomIn()}
      >
        <Plus />
        <span className="sr-only">{t("map.zoomIn")}</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-none"
        onClick={() => map.zoomOut()}
      >
        <Minus />
        <span className="sr-only">{t("map.zoomOut")}</span>
      </Button>
    </div>
  );
}

export default function WorldMapView() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const playersQuery = useOnlinePlayers();
  const guildsQuery = useGuilds();
  const serverQuery = useServerInfo();
  const [coordinates, setCoordinates] = useState<readonly [number, number]>([
    0, 0,
  ]);
  const [layers, setLayers] = useState({
    players: true,
    camps: true,
    towers: false,
    fastTravel: false,
  });

  const icons = useMemo(
    () => ({
      player: icon({
        iconUrl: playerIconUrl,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        tooltipAnchor: [0, -32],
      }),
      camp: icon({
        iconUrl: baseIconUrl,
        iconSize: [46, 46],
        iconAnchor: [23, 42],
      }),
      tower: icon({
        iconUrl: bossTowerIconUrl,
        iconSize: [38, 38],
        iconAnchor: [19, 36],
      }),
      fastTravel: icon({
        iconUrl: fastTravelIconUrl,
        iconSize: [34, 34],
        iconAnchor: [17, 32],
      }),
    }),
    [],
  );

  const toggleLayer = (key: keyof typeof layers, checked: boolean) => {
    setLayers((current) => ({ ...current, [key]: checked }));
  };

  return (
    <div className="relative h-[calc(100dvh-11rem)] min-h-[520px] overflow-hidden lg:h-[calc(100dvh-7rem)]">
      <MapContainer
        crs={CRS.Simple}
        center={[-256, 256]}
        zoom={1}
        minZoom={0}
        maxZoom={8}
        zoomControl={false}
        attributionControl={false}
        maxBounds={[
          [-512, 0],
          [0, 512],
        ]}
        className="h-full w-full"
      >
        <TileLayer
          url="/map/tiles/{z}/{x}/{y}.webp"
          tileSize={512}
          maxNativeZoom={4}
          noWrap
          bounds={[
            [-512, 0],
            [0, 512],
          ]}
        />

        {layers.fastTravel
          ? points.fast_travel.map((point, index) => (
              <Marker
                key={`fast-${index}-${point[0]}-${point[1]}`}
                position={toMapPosition(point)}
                icon={icons.fastTravel}
              />
            ))
          : null}

        {layers.towers
          ? points.boss_tower.map((point, index) => (
              <Marker
                key={`tower-${index}-${point[0]}-${point[1]}`}
                position={toMapPosition(point)}
                icon={icons.tower}
              />
            ))
          : null}

        {layers.players
          ? (playersQuery.data ?? [])
              .filter(
                (player) => player.location_x !== 0 || player.location_y !== 0,
              )
              .map((player) => (
                <Marker
                  key={player.player_uid}
                  position={toMapPosition([
                    player.location_x,
                    player.location_y,
                  ])}
                  icon={icons.player}
                  eventHandlers={{
                    click: () =>
                      navigate(
                        `/players?player=${encodeURIComponent(player.player_uid)}`,
                      ),
                  }}
                >
                  <Tooltip permanent direction="top" opacity={0.95}>
                    {player.nickname}
                  </Tooltip>
                </Marker>
              ))
          : null}

        {layers.camps
          ? (guildsQuery.data ?? []).flatMap((guild) =>
              guild.base_camp.map((camp, index) => (
                <Fragment key={`${guild.admin_player_uid}-${camp.id || index}`}>
                  <Marker
                    position={toMapPosition([camp.location_x, camp.location_y])}
                    icon={icons.camp}
                  >
                    <Popup>
                      <div className="min-w-48 space-y-2">
                        <p className="font-semibold">{guild.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {guild.players.length} {t("guilds.members")} · Lv.
                          {guild.base_camp_level}
                        </p>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            navigate(
                              `/guilds?guild=${encodeURIComponent(guild.admin_player_uid)}`,
                            )
                          }
                        >
                          {t("action.view")}
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={toMapPosition([camp.location_x, camp.location_y])}
                    radius={toMapDistance(camp.area)}
                    pathOptions={{
                      color: "#168c96",
                      fillColor: "#168c96",
                      fillOpacity: 0.08,
                      weight: 1,
                    }}
                  />
                </Fragment>
              )),
            )
          : null}

        <CoordinateTracker onMove={setCoordinates} />
        <MapZoomControls />
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[600] flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto max-w-[calc(100%-3.5rem)] rounded-md border bg-background/94 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <MapPinned className="size-4 text-primary" />
            <h1 className="text-sm font-semibold">{t("map.title")}</h1>
            <Badge variant="outline" className="hidden sm:inline-flex">
              <StatusDot online={serverQuery.isSuccess} />
              {serverQuery.data?.name || "Palworld"}
            </Badge>
          </div>
          <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
            {t("map.subtitle")}
          </p>
        </div>

        <div className="pointer-events-auto rounded-md border bg-background/94 p-2 shadow-sm backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold">
            <Layers3 className="size-4" />
            <span className="hidden sm:inline">{t("map.layers")}</span>
          </div>
          <div className="grid gap-2 sm:min-w-36">
            {(
              [
                ["players", "map.players"],
                ["camps", "map.camps"],
                ["towers", "map.towers"],
                ["fastTravel", "map.fastTravel"],
              ] as const
            ).map(([key, label]) => (
              <Label
                key={key}
                className="flex items-center gap-2 text-xs font-normal"
              >
                <Checkbox
                  checked={layers[key]}
                  onCheckedChange={(checked) =>
                    toggleLayer(key, checked === true)
                  }
                />
                <span className="hidden sm:inline">{t(label)}</span>
              </Label>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-3 z-[600] sm:left-4">
        <div className="flex items-center gap-2 rounded-md border bg-background/94 px-3 py-2 shadow-sm backdrop-blur-sm">
          <LocateFixed className="size-4 text-[var(--signal)]" />
          <span className="font-data text-xs">
            X {formatCoordinate(coordinates[0])} / Y{" "}
            {formatCoordinate(coordinates[1])}
          </span>
        </div>
      </div>
    </div>
  );
}
