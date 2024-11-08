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

import { app, BrowserWindow, nativeTheme, shell } from "electron";
import { isDevelopment } from "./utils";
import { registerProtocol, PROTOCOL_URL } from "./utils/protocol";
import { configureAutoUpdater } from "./utils/autoupdater";
import { getBackgroundColor, getTheme, setTheme } from "./utils/theme";
import { setupMenu } from "./utils/menu";
import { WindowState } from "./utils/window-state";
import { setupJumplist } from "./utils/jumplist";
import { setupTray } from "./utils/tray";
import { CLIOptions, parseArguments } from "./cli";
import { AssetManager } from "./utils/asset-manager";
import { createIPCHandler } from "electron-trpc/main";
import { router, api } from "./api";
import { config } from "./utils/config";
import path from "path";
import { bringToFront } from "./utils/bring-to-front";
import { bridge } from "./api/bridge";
import { setupDesktopIntegration } from "./utils/desktop-integration";
import { disableCustomDns, enableCustomDns } from "./utils/custom-dns";
import { Messages, setI18nGlobal } from "@notesnook/intl";
import { i18n } from "@lingui/core";

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

async function createWindow() {
  const cliOptions = await parseArguments(process.argv);
  setTheme(getTheme());

  const mainWindowState = new WindowState({});
  const mainWindow = new BrowserWindow({
    show: !cliOptions.hidden,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    darkTheme: getTheme() === "dark",
    backgroundColor: getBackgroundColor(),
    opacity: 0,
    autoHideMenuBar: false,
    icon: AssetManager.appIcon({
      size: 512,
      format: process.platform === "win32" ? "ico" : "png"
    }),

    ...(config.desktopSettings.nativeTitlebar
      ? {}
      : {
          titleBarStyle: process.platform === "win32" || process.platform === "darwin" ? "hidden" : "default",
          frame: process.platform === "win32" || process.platform === "darwin",
          titleBarOverlay: {
            height: 37,
            color: "#00000000",
            symbolColor: config.windowControlsIconColor
          },
          trafficLightPosition: {
            x: 16,
            y: 12
          }
        }),

    webPreferences: {
      zoomFactor: config.zoomFactor,
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true,
      spellcheck: config.isSpellCheckerEnabled,
      preload: __dirname + "/preload.js"
    }
  });

  createIPCHandler({ router, windows: [mainWindow] });
  globalThis.window = mainWindow;
  mainWindow.setMenuBarVisibility(false);
  mainWindowState.manage(mainWindow);

  if (cliOptions.hidden && !config.desktopSettings.minimizeToSystemTray)
    mainWindow.minimize();

  await mainWindow.webContents.loadURL(`${createURL(cliOptions, "/")}`);
  mainWindow.setOpacity(1);

  if (config.privacyMode) {
    await api.integration.setPrivacyMode({ enabled: config.privacyMode });
  }

  await AssetManager.loadIcons();
  setupDesktopIntegration(config.desktopSettings);

  mainWindow.webContents.session.setSpellCheckerDictionaryDownloadURL(
    "http://dictionaries.notesnook.com/"
  );
  mainWindow.webContents.session.setProxy({ proxyRules: config.proxyRules });

  mainWindow.once("closed", () => {
    globalThis.window = null;
  });

  setupMenu();
  setupJumplist();

  if (isDevelopment())
    mainWindow.webContents.openDevTools({ mode: "bottom", activate: true });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  nativeTheme.on("updated", () => {
    setupTray();
    setupJumplist();
  });
}

app.once("ready", async () => {
  console.info("App ready. Opening window.");

  if (config.customDns) enableCustomDns();
  else disableCustomDns();

  if (!isDevelopment()) registerProtocol();
  await createWindow();
  configureAutoUpdater();
});

app.once("window-all-closed", () => {
  if (process.platform !== "darwin" || MAC_APP_STORE) {
    app.quit();
  }
});

app.on("second-instance", async (_ev, argv) => {
  if (!globalThis.window) return;
  const cliOptions = await parseArguments(argv);
  if (cliOptions.note) bridge.onCreateItem("note");
  if (cliOptions.notebook) bridge.onCreateItem("notebook");
  if (cliOptions.reminder) bridge.onCreateItem("reminder");
  bringToFront();
});

app.on("activate", () => {
  if (globalThis.window === null) {
    createWindow();
  }
});

function createURL(options: CLIOptions, path = "/") {
  const url = new URL(isDevelopment() ? "http://localhost:3000" : PROTOCOL_URL);

  url.pathname = path;
  if (options.note === true) url.hash = "/notes/create/1";
  else if (options.notebook === true) url.hash = "/notebooks/create";
  else if (options.reminder === true) url.hash = "/reminders/create";
  else if (typeof options.note === "string")
    url.hash = `/notes/${options.note}/edit`;
  else if (typeof options.notebook === "string")
    url.hash = `/notebooks/${options.notebook}`;

  return url;
}
