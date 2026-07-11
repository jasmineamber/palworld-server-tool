import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";

import { LoadingState } from "@/components/common/data-state";
import { AppShell } from "@/components/layout/app-shell";

const OverviewView = lazy(() => import("@/features/overview/overview-view"));
const PlayersView = lazy(() => import("@/features/players/players-view"));
const GuildsView = lazy(() => import("@/features/guilds/guilds-view"));
const WorldMapView = lazy(() => import("@/features/map/map-view"));
const OperationsView = lazy(
  () => import("@/features/operations/operations-view"),
);
const ConfigurationView = lazy(
  () => import("@/features/configuration/configuration-view"),
);

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            index
            element={
              <Suspense fallback={<LoadingState />}>
                <OverviewView />
              </Suspense>
            }
          />
          <Route
            path="players"
            element={
              <Suspense fallback={<LoadingState />}>
                <PlayersView />
              </Suspense>
            }
          />
          <Route
            path="guilds"
            element={
              <Suspense fallback={<LoadingState />}>
                <GuildsView />
              </Suspense>
            }
          />
          <Route
            path="map"
            element={
              <Suspense fallback={<LoadingState />}>
                <WorldMapView />
              </Suspense>
            }
          />
          <Route
            path="operations"
            element={
              <Suspense fallback={<LoadingState />}>
                <OperationsView />
              </Suspense>
            }
          />
          <Route
            path="configuration"
            element={
              <Suspense fallback={<LoadingState />}>
                <ConfigurationView />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}
