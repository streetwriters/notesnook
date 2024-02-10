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
import { Routes, init } from "./bootstrap";
import { logger } from "./utils/logger";
import { AppEventManager, AppEvents } from "./common/app-events";
import { BaseThemeProvider } from "./components/theme-provider";
import { register } from "./utils/stream-saver/mitm";
import { getServiceWorkerVersion } from "./utils/version";
import { ErrorBoundary, ErrorComponent } from "./components/error-boundary";

renderApp();

async function renderApp() {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;
  const root = createRoot(rootElement);

  try {
    const { component, props, path } = await init();

    if (serviceWorkerWhitelist.includes(path)) await initializeServiceWorker();

    const { default: Component } = await component();

    const { default: AppLock } = await import("./views/app-lock");
    root.render(
      <ErrorBoundary>
        <BaseThemeProvider
          onRender={() => document.getElementById("splash")?.remove()}
          addGlobalStyles
          sx={{ height: "100%", bg: "background" }}
        >
          <AppLock>
            <Component route={props?.route || "login:email"} />
          </AppLock>
        </BaseThemeProvider>
      </ErrorBoundary>
    );
  } catch (e) {
    root.render(
      <ErrorComponent
        error={e}
        resetErrorBoundary={() => window.location.reload()}
      />
    );
  }
}

const serviceWorkerWhitelist: Routes[] = ["default"];
async function initializeServiceWorker() {
  if (!IS_DESKTOP_APP) {
    logger.info("Initializing service worker...");
    const serviceWorker = await import("./service-worker-registration");

    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://bit.ly/CRA-PWA
    serviceWorker.register({
      onUpdate: async (registration: ServiceWorkerRegistration) => {
        if (!registration.waiting) return;
        const { formatted } = await getServiceWorkerVersion(
          registration.waiting
        );
        AppEventManager.publish(AppEvents.updateDownloadCompleted, {
          version: formatted
        });
      },
      onSuccess() {
        register();
      }
    });
    // window.addEventListener("beforeinstallprompt", () => showInstallNotice());
  }
}

if (import.meta.hot) import.meta.hot.accept();
