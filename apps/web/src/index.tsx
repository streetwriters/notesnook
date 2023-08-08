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

import { render } from "react-dom";
import { Routes, init } from "./bootstrap";
import { logger } from "./utils/logger";
import { loadDatabase } from "./hooks/use-database";
import { AppEventManager, AppEvents } from "./common/app-events";
import { BaseThemeProvider } from "./components/theme-provider";

renderApp();

async function renderApp() {
  const { component, props, path } = await init();

  if (serviceWorkerWhitelist.includes(path)) await initializeServiceWorker();
  if (IS_DESKTOP_APP) await loadDatabase("db");

  const { default: Component } = await component();
  logger.measure("app render");
  render(
    <BaseThemeProvider
      addGlobalStyles
      sx={{ height: path === "default" ? "100%" : "unset" }}
    >
      <Component route={props?.route || "login:email"} />
    </BaseThemeProvider>,
    document.getElementById("root"),
    () => {
      logger.measure("app render");

      document.getElementById("splash")?.remove();
    }
  );
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
        const { getServiceWorkerVersion } = await import("./utils/version");
        const { formatted } = await getServiceWorkerVersion(
          registration.waiting
        );
        AppEventManager.publish(AppEvents.updateDownloadCompleted, {
          version: formatted
        });
      }
    });
    // window.addEventListener("beforeinstallprompt", () => showInstallNotice());
  }
}
