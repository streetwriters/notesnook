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

import { init } from "@notesnook/web/src/bootstrap";
import { createRoot } from "react-dom/client";
import {
  ErrorBoundary,
  ErrorComponent
} from "@notesnook/web/src/components/error-boundary";
import { BaseThemeProvider } from "@notesnook/web/src/components/theme-provider";
import { App } from "./app";

renderApp();

async function renderApp() {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;
  const root = createRoot(rootElement);
  try {
    const { component, props } = await init();

    const { useKeyStore } = await import(
      "@notesnook/web/src/interfaces/key-store"
    );
    await useKeyStore.getState().init();

    const { default: Component } = await component();
    const { default: AppLock } = await import(
      "@notesnook/web/src/views/app-lock"
    );

    root.render(
      <ErrorBoundary>
        <BaseThemeProvider
          onRender={() => document.getElementById("splash")?.remove()}
          sx={{
            display: "flex",
            "#app": { flex: 1, height: "unset" },
            "& > :first-child:not(#menu-wrapper)": { flex: 1 },
            height: "100%"
          }}
        >
          <AppLock>
            <Component route={props?.route || "login:email"} />
          </AppLock>
          <App />
        </BaseThemeProvider>
      </ErrorBoundary>
    );
  } catch (e) {
    root.render(
      <>
        <ErrorComponent
          error={e}
          resetErrorBoundary={() => window.location.reload()}
        />
      </>
    );
  }
}
