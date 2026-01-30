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

import "./overrides";
import { app, nativeTheme, dialog } from "electron";
import { isDevelopment } from "./utils";
import { registerProtocol } from "./utils/protocol";
import { configureAutoUpdater } from "./utils/autoupdater";
import { getTheme, setTheme } from "./utils/theme";
import { setupTray } from "./utils/tray";
import { parseArguments } from "./cli";
import { AssetManager } from "./utils/asset-manager";
import { config } from "./utils/config";
import path from "path";
import { bringToFront } from "./utils/bring-to-front";
import { bridge } from "./api/bridge";
import { disableCustomDns, enableCustomDns } from "./utils/custom-dns";
import { Messages, setI18nGlobal } from "@notesnook/intl";
import { i18n } from "@lingui/core";
import { windowManager } from "./utils/window-manager";
import { setupJumplist } from "./utils/jumplist";

const locale =
  process.env.NODE_ENV === "development"
    ? import("@notesnook/intl/locales/$pseudo-LOCALE.json")
    : import("@notesnook/intl/locales/$en.json");
locale.then(({ default: locale }) => {
  i18n.load({
    en: locale.messages as unknown as Messages
  });
  i18n.activate("en");
});
setI18nGlobal(i18n);

// only run a single instance
if (!MAC_APP_STORE && !app.requestSingleInstanceLock()) {
  console.log("Another instance is already running!");
  app.exit();
}

if (process.platform == "win32" && process.env.PORTABLE_EXECUTABLE_DIR) {
  console.log("Portable app: true");
  const root = path.join(process.env.PORTABLE_EXECUTABLE_DIR, "Notesnook");
  app.setPath("appData", path.join(root, "AppData"));
  app.setPath("documents", path.join(root, "Documents"));
  app.setPath("userData", path.join(root, "UserData"));
}

if (process.platform === "win32") {
  app.setAppUserModelId(app.name);
}

process.on("uncaughtException", (error) => {
  console.error("uncaughtException:", error);
});
process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
});

app.commandLine.appendSwitch("lang", "en-US");

app.once("ready", async () => {
  console.info("App ready. Opening window.");

  if (app.runningUnderARM64Translation) {
    console.log("App is running under ARM64 translation");
    dialog.showMessageBoxSync({
      message:
        "Notesnook detected that it is running under ARM64 translation. For the best performance, please download the ARM64 build of Notesnook from our website.",
      type: "warning",
      buttons: ["Okay"],
      title: "Degraded Performance Warning"
    });
  }

  if (config.customDns) enableCustomDns();
  else disableCustomDns();

  if (!isDevelopment()) registerProtocol();

  const cliOptions = await parseArguments(process.argv);
  setTheme(getTheme());
  await AssetManager.loadIcons();

  await windowManager.createMainWindow(cliOptions);
  configureAutoUpdater();
});

app.once("window-all-closed", () => {
  if (process.platform !== "darwin" || MAC_APP_STORE) {
    app.quit();
  }
});

app.on("second-instance", async (_ev, argv) => {
  if (!windowManager.getMainWindow()) return;
  const cliOptions = await parseArguments(argv);
  if (cliOptions.note) bridge.onCreateItem("note");
  if (cliOptions.notebook) bridge.onCreateItem("notebook");
  if (cliOptions.reminder) bridge.onCreateItem("reminder");
  bringToFront();
});

app.on("activate", async () => {
  if (windowManager.getMainWindow() === null) {
    const cliOptions = await parseArguments(process.argv);
    await windowManager.createMainWindow(cliOptions);
  }
});

nativeTheme.on("updated", () => {
  setupTray();
  setupJumplist();
});
