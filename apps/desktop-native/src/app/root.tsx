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

import { useEffect, useState } from "react";
import { EV, EVENTS } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Flex, Text } from "@ui";
import { boot, prepareBoot, type BootOptions } from "./boot";
import { Demo, type Status } from "./demo";
import { PlatformSmoke } from "./platform-smoke";
import { getPersistence, getRoute } from "./bootstrap";
import { useStore as useNoteStore } from "./stores/note-store";
import { useBootStore } from "./stores/boot-store";
import Config from "./utils/config";
import { logStartup } from "./utils/startup";
import AppLock from "./views/app-lock";
import { BaseThemeProvider } from "./components/theme-provider";
import { ErrorBoundary, GlobalErrorHandler } from "./components/error-boundary";
import { Logo } from "./components/navigation-menu/logo";
import { useKeyStore } from "./interfaces/key-store";
import { usePathname } from "./navigation";
import {
  useWindowReveal,
  WindowRevealProvider
} from "./components/window-reveal";

export type RootProps = BootOptions & {
  screen?: "app" | "demo" | "platform";
  titleBarInset?: number;
  colorScheme: "light" | "dark";
  onToggleColorScheme: () => void;
};

export function Root(props: RootProps) {
  const status = useBootStore((store) => store.status);
  return (
    <WindowRevealProvider failed={status === "error"}>
      <RootContent {...props} />
    </WindowRevealProvider>
  );
}

function RootContent(props: RootProps) {
  const { screen = "app", titleBarInset, ...bootOptions } = props;
  const state = useBootStore();
  useState(() => prepareBoot(bootOptions));
  usePathname();
  const persistence = getPersistence(
    getRoute({
      isLoggedIn:
        state.status === "ready"
          ? !!state.user
          : Config.get("isLoggedIn", false)
    }).path
  );

  useEffect(() => {
    useKeyStore
      .getState()
      .init({ persistence })
      .catch((e: unknown) => console.error("key store init failed", e));
  }, [persistence]);

  useEffect(() => {
    logStartup("shell committed");
    const unsubscribe = useNoteStore.subscribe(
      (store) => store.notes,
      (notes) => {
        if (!notes) return;
        logStartup("notes loaded");
        unsubscribe();
      }
    );
    boot(bootOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const demoState: Status =
    state.status === "ready"
      ? {
          status: "ready",
          version: state.version ?? "",
          online: !!state.online,
          user: state.user
        }
      : state.status === "error"
      ? { status: "error", message: state.message ?? "" }
      : { status: "loading" };

  if (screen === "demo") return <Demo {...props} state={demoState} />;
  if (screen === "platform" && state.status === "ready")
    return <PlatformSmoke />;
  if (screen === "platform") return null;
  if (state.status !== "error")
    return (
      <ErrorBoundary>
        <GlobalErrorHandler>
          <BaseThemeProvider
            sx={{ flex: 1, bg: "background", overflow: "hidden" }}
          >
            <AppLock>
              <RouteWrapper
                isLoggedIn={
                  state.status === "ready"
                    ? !!state.user
                    : Config.get("isLoggedIn", false)
                }
                titleBarInset={titleBarInset}
              />
            </AppLock>
          </BaseThemeProvider>
        </GlobalErrorHandler>
      </ErrorBoundary>
    );
  return (
    <Flex
      sx={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        bg: "background"
      }}
    >
      <Text testID="boot-state" sx={{ color: "paragraph" }}>
        {`Error: ${state.message}`}
      </Text>
    </Flex>
  );
}

function RouteWrapper(props: { isLoggedIn: boolean; titleBarInset?: number }) {
  usePathname();
  const [isMigrating, setIsMigrating] = useState(false);
  const { route, path } = getRoute({ isLoggedIn: props.isLoggedIn });
  const { Component } = route;
  const routeProps = route.props;
  const markContentReady = useWindowReveal();

  useEffect(() => {
    if (!isMigrating) markContentReady();
  }, [isMigrating, markContentReady]);

  useEffect(() => {
    const started = EV.subscribe(EVENTS.migrationStarted, (name) =>
      setIsMigrating(name === "notesnook")
    );
    const finished = EV.subscribe(EVENTS.migrationFinished, () =>
      setIsMigrating(false)
    );
    return () => {
      started.unsubscribe();
      finished.unsubscribe();
    };
  }, []);

  if (isMigrating)
    return (
      <Flex
        sx={{
          flex: 1,
          bg: "background",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 10
        }}
      >
        <Logo size={120} />
        <Text variant="body" sx={{ fontFamily: "monospace" }}>
          {strings.migratingDatabaseNotice()}
        </Text>
      </Flex>
    );

  return (
    <Component key={path} titleBarInset={props.titleBarInset} {...routeProps} />
  );
}
