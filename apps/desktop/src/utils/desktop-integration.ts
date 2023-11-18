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
import { app } from "electron";
import { DesktopIntegration, config } from "./config";
import { setupTray, destroyTray } from "./tray";
import { AutoLaunch } from "./autolaunch";

export function setupDesktopIntegration(
  desktopIntegration: DesktopIntegration
) {
  if (
    desktopIntegration.closeToSystemTray ||
    desktopIntegration.minimizeToSystemTray
  ) {
    setupTray();
  } else {
    destroyTray();
  }

  // when close to system tray is enabled, it becomes nigh impossible
  // to "quit" the app. This is necessary in order to fix that.
  app.on("before-quit", () =>
    desktopIntegration.closeToSystemTray ? app.exit(0) : null
  );

  globalThis.window?.on("close", (e) => {
    if (config.desktopSettings.closeToSystemTray) {
      e.preventDefault();
      if (process.platform == "darwin") {
        // on macOS window cannot be minimized/hidden if it is already fullscreen
        // so we just close it.
        if (globalThis.window?.isFullScreen()) app.exit(0);
        else app.hide();
      } else {
        try {
          globalThis.window?.minimize();
          globalThis.window?.hide();
        } catch (error) {
          console.error(error);
        }
      }
    }
  });

  globalThis.window?.on("minimize", () => {
    if (config.desktopSettings.minimizeToSystemTray) {
      if (process.platform == "darwin") {
        app.hide();
      } else {
        globalThis.window?.hide();
      }
    }
  });

  if (desktopIntegration.autoStart) {
    AutoLaunch.enable(!!desktopIntegration.startMinimized);
  }
}
