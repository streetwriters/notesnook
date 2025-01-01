/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { createRoot } from "react-dom/client";
import { init, Routes } from "./bootstrap";
import { BaseThemeProvider } from "./components/theme-provider";
import {
  ErrorBoundary,
  ErrorComponent,
  GlobalErrorHandler
} from "./components/error-boundary";
import { desktop } from "./common/desktop-bridge";
import { useKeyStore } from "./interfaces/key-store";
import Config from "./utils/config";
import { usePromise } from "@notesnook/common";
import { AuthProps } from "./views/auth";
import { loadDatabase } from "./hooks/use-database";
import AppLock from "./views/app-lock";
import { Text } from "@theme-ui/components";
import { EV, EVENTS } from "@notesnook/core";
import { useEffect, useState } from "react";

export async function startApp() {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;
  const root = createRoot(rootElement);

  window.hasNativeTitlebar =
    !IS_DESKTOP_APP ||
    !!(await desktop?.integration.desktopIntegration
      .query()
      ?.then((s) => s.nativeTitlebar));

  const TitleBar = window.hasNativeTitlebar
    ? () => <></>
    : await import("./components/title-bar").then((m) => m.TitleBar);

  try {
    const { Component, props, path } = await init();

    await useKeyStore.getState().init();

    root.render(
      <>
        <TitleBar />
        <ErrorBoundary>
          <GlobalErrorHandler>
            <BaseThemeProvider
              onRender={() => document.getElementById("splash")?.remove()}
              sx={{ bg: "background", flex: 1, overflow: "hidden" }}
            >
              <AppLock>
                <RouteWrapper
                  Component={Component}
                  path={path}
                  routeProps={props}
                />
              </AppLock>
            </BaseThemeProvider>
          </GlobalErrorHandler>
        </ErrorBoundary>
      </>
    );
  } catch (e) {
    console.error(e);
    root.render(
      <>
        <TitleBar isUnderlay={false} />
        <ErrorComponent
          error={e}
          resetErrorBoundary={() => window.location.reload()}
        />
      </>
    );
  }
}

function RouteWrapper(props: {
  Component: (props: AuthProps) => JSX.Element;
  path: Routes;
  routeProps: AuthProps | null;
}) {
  const [isMigrating, setIsMigrating] = useState(false);
  const { Component, path, routeProps } = props;

  useEffect(() => {
    EV.subscribe(EVENTS.migrationStarted, (name) =>
      setIsMigrating(name === "notesnook")
    );
    EV.subscribe(EVENTS.migrationFinished, () => setIsMigrating(false));
    return () => {
      EV.unsubscribeAll();
    };
  }, []);

  const result = usePromise(async () => {
    performance.mark("load:database");
    await loadDatabase(
      path !== "/sessionexpired" || Config.get("sessionExpired", false)
        ? "db"
        : "memory"
    );
  }, [path]);

  if (result.status === "rejected") {
    throw result.reason instanceof Error
      ? result.reason
      : new Error(result.reason);
  }
  if (result.status === "pending" || isMigrating)
    return (
      <div
        style={{
          backgroundColor: "var(--background)",
          height: "100%",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <svg
          style={{
            height: 120,
            transform: "scale(1)",
            animation: "pulse 2s infinite",
            marginBottom: 10
          }}
        >
          <use href="#themed-logo" />
        </svg>
        <Text variant="body" sx={{ fontFamily: "monospace" }}>
          {isMigrating
            ? "Migrating database. This might take a while."
            : "Decrypting your notes"}
        </Text>
      </div>
    );
  performance.mark("render:app");
  return <Component route={routeProps?.route || "login:email"} />;
}

if (import.meta.hot) import.meta.hot.accept();
