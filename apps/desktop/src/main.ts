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
import { app, nativeTheme, shell, dialog } from "electron";
import { isDevelopment } from "./utils";
import { registerProtocol } from "./utils/protocol";
import { configureAutoUpdater } from "./utils/autoupdater";
import { getTheme, setTheme } from "./utils/theme";
import { setupJumplist } from "./utils/jumplist";
import { setupTray } from "./utils/tray";
import { parseArguments } from "./cli";
import { AssetManager } from "./utils/asset-manager";
import { api } from "./api";
import { config } from "./utils/config";
import path from "path";
import { bringToFront } from "./utils/bring-to-front";
import { bridge } from "./api/bridge";
import { setupDesktopIntegration } from "./utils/desktop-integration";
import { disableCustomDns, enableCustomDns } from "./utils/custom-dns";
import { Messages, setI18nGlobal } from "@notesnook/intl";
import { i18n } from "@lingui/core";
import { PATHS } from "./constants";
import { normalizePathString } from "./utils/resolve-path";
import { windowManager } from "./utils/window-manager";

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
setI18nGlobal(i18n as unknown as Parameters<typeof setI18nGlobal>[0]);

const appHostnames = isDevelopment()
  ? ["localhost", "127.0.0.1"]
  : ["app.notesnook.com"];
// Pending nn:// link to open once the window is ready (used on Windows/Linux
// when the app is launched via the nn:// protocol for the first time).
let pendingNNLink: string | undefined = findNNLink(process.argv);

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

async function createWindow() {
  const cliOptions = await parseArguments(process.argv);
  setTheme(getTheme());

  const mainWindow = await windowManager.createMainWindow(cliOptions);
  globalThis.window = mainWindow;

  if (config.privacyMode) {
    await api.integration.setPrivacyMode({ enabled: config.privacyMode });
  }

  await AssetManager.loadIcons();
  setupDesktopIntegration(config.desktopSettings);

  mainWindow.once("closed", () => {
    globalThis.window = null;
  });

  setupTray();

  mainWindow.webContents.on("will-navigate", (event, url) => {
    try {
      const parsedUrl = new URL(url);
      if (!appHostnames.includes(parsedUrl.hostname)) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch (e) {
      console.error("will-navigate: failed to parse URL", url, e);
      event.preventDefault();
    }
  });

  nativeTheme.on("updated", () => {
    setupTray();
    setupJumplist();
  });

  if (pendingNNLink) {
    bridge.onOpenLink(pendingNNLink);
    pendingNNLink = undefined;
  }
}

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

  if (!MAC_APP_STORE) app.setAsDefaultProtocolClient("nn");

  if (!isDevelopment()) registerProtocol();
  await createWindow();
  await migrateBackupDirectory();
  await configureAutoUpdater();
});

app.once("window-all-closed", () => {
  if (process.platform !== "darwin" || MAC_APP_STORE) {
    app.quit();
  }
});

app.on("second-instance", async (_ev, argv) => {
  const nnLink = findNNLink(argv);
  if (nnLink) {
    if (globalThis.window) {
      bridge.onOpenLink(nnLink);
      bringToFront();
    }
    return;
  }
  const cliOptions = await parseArguments(argv);
  if (cliOptions.note) bridge.onCreateItem("note");
  if (cliOptions.notebook) bridge.onCreateItem("notebook");
  if (cliOptions.reminder) bridge.onCreateItem("reminder");
  bringToFront();
});

// macOS opens URLs via this event. The app may or may not be fully loaded yet.
app.on("open-url", (event, url) => {
  event.preventDefault();
  if (!url.startsWith("nn://")) return;
  if (globalThis.window) {
    bridge.onOpenLink(url);
    bringToFront();
  } else {
    // Window not ready yet — store for when createWindow finishes loading.
    pendingNNLink = url;
  }
});

app.on("activate", () => {
  if (!windowManager.getMainWindow()) {
    createWindow();
  }
});

function findNNLink(argv: string[]): string | undefined {
  return argv.find((arg) => arg.startsWith("nn://"));
}

async function migrateBackupDirectory() {
  if (!globalThis.window) return;
  try {
    if (config.backupDirectory !== PATHS.backupsDirectory) return;
    const oldPath = await globalThis.window?.webContents.executeJavaScript(
      `localStorage.getItem("backupStorageLocation")`
    );
    if (!oldPath || oldPath === PATHS.backupsDirectory) return;
    config.backupDirectory = normalizePathString(oldPath);
  } catch (e) {
    console.error("Failed to migrate backup directory", e);
    const pressedButton = dialog.showMessageBoxSync(globalThis.window, {
      message:
        "Failed to migrate backup directory. It has been reset to default.",
      title: "Backup Directory Migration Failed",
      type: "error",
      buttons: ["Set backup directory", "Ignore"]
    });
    if (pressedButton === 0) {
      await api.integration.selectBackupDirectory();
    }
  }
}
