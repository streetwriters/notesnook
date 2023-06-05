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
/* global MAC_APP_STORE, RELEASE */

import "isomorphic-fetch";
import { app, BrowserWindow, nativeTheme, shell } from "electron";
import { isDevelopment } from "./utils";
import { registerProtocol, PROTOCOL_URL } from "./protocol";
import { configureAutoUpdater } from "./autoupdate";
import { getBackgroundColor, getTheme, setTheme } from "./config/theme";
import getZoomFactor from "./ipc/calls/getZoomFactor";
import { logger } from "./logger";
import { setupMenu } from "./menu";
import { WindowState } from "./config/window-state";
import { sendMessageToRenderer } from "./ipc/utils";
import { EVENTS } from "./events";
import "./ipc/index.js";
import getPrivacyMode from "./ipc/calls/getPrivacyMode";
import setPrivacyMode from "./ipc/actions/setPrivacyMode";
import { getIsSpellCheckerEnabled } from "./config/spellChecker";
import { getDesktopIntegration } from "./config/desktopIntegration";
import { AutoLaunch } from "./autolaunch";
import { setupJumplist } from "./jumplist";
import { setupTray } from "./tray";
import { parseArguments } from "./cli";
import { AssetManager } from "./asset-manager";

if (!RELEASE) {
  require("electron-reloader")(module);
}

// only run a single instance

if (!MAC_APP_STORE && !app.requestSingleInstanceLock()) {
  app.exit();
}

if (process.platform === "win32") {
  app.setAppUserModelId(app.name);
}

var mainWindowState;
async function createWindow() {
  await AssetManager.loadIcons();
  const cliOptions = await parseArguments();

  mainWindowState = new WindowState({});
  setTheme(getTheme());

  const mainWindow = new BrowserWindow({
    show: false,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    darkTheme: getTheme() === "dark",
    backgroundColor: getBackgroundColor(),

    autoHideMenuBar: true,
    icon: AssetManager.appIcon({
      size: 512,
      format: process.platform === "win32" ? "ico" : "png"
    }),
    webPreferences: {
      zoomFactor: getZoomFactor(),
      devTools: true, // isDev,
      nodeIntegration: false, //true,
      contextIsolation: true,
      nativeWindowOpen: true,
      spellcheck: getIsSpellCheckerEnabled(),
      preload: __dirname + "/preload.js"
    }
  });

  mainWindow.on("show", () => {
    if (getPrivacyMode()) {
      setPrivacyMode({ privacyMode: getPrivacyMode() });
    }
  });

  mainWindowState.manage(mainWindow);
  globalThis.window = mainWindow;
  setupMenu();
  setupJumplist();
  setupDesktopIntegration(cliOptions.hidden);

  mainWindow.webContents.session.setSpellCheckerDictionaryDownloadURL(
    "http://dictionaries.notesnook.com/"
  );

  if (isDevelopment())
    mainWindow.webContents.openDevTools({ mode: "right", activate: true });

  try {
    await mainWindow.loadURL(`${createURL(cliOptions)}`);
  } catch (e) {
    logger.error(e);
  }

  mainWindow.on("closed", () => {
    globalThis.window = null;
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  nativeTheme.on("updated", () => {
    setupTray();
    setupJumplist();

    if (getTheme() === "system") {
      sendMessageToRenderer(EVENTS.themeChanged, {
        theme: nativeTheme.shouldUseDarkColors ? "dark" : "light"
      });
    }
  });
}

app.commandLine.appendSwitch("lang", "en-US");
app.on("ready", async () => {
  logger.info("App ready. Opening window.");

  registerProtocol();
  await createWindow();
  configureAutoUpdater();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" || MAC_APP_STORE) {
    app.quit();
  }
});

app.on("activate", () => {
  if (globalThis.window === null) {
    createWindow();
  }
});

/**
 * @param {import("./cli").CLIOptions} options
 */
function createURL(options) {
  const url = new URL(isDevelopment() ? "http://localhost:3000" : PROTOCOL_URL);

  if (options.note === true) url.hash = "/notes/create/1";
  else if (options.notebook === true) url.hash = "/notebooks/create";
  else if (options.reminder === true) url.hash = "/reminders/create";
  else if (typeof options.note === "string")
    url.hash = `/notes/${options.note}/edit`;
  else if (typeof options.notebook === "string")
    url.hash = `/notebooks/${options.notebook}`;

  return url;
}

function setupDesktopIntegration(hidden) {
  const desktopIntegration = getDesktopIntegration();

  if (
    desktopIntegration.closeToSystemTray ||
    desktopIntegration.minimizeToSystemTray
  ) {
    setupTray();
  }

  globalThis.window.on("ready-to-show", () => {
    if (!hidden) {
      globalThis.window.show();
    }

    if (hidden && !desktopIntegration.minimizeToSystemTray) {
      globalThis.window.show();
      globalThis.window.minimize();
    }
  });

  // when close to system tray is enabled, it becomes nigh impossible
  // to "quit" the app. This is necessary in order to fix that.
  if (desktopIntegration.closeToSystemTray) {
    app.on("before-quit", () => app.exit(0));
  }

  globalThis.window.on("close", (e) => {
    if (getDesktopIntegration().closeToSystemTray) {
      e.preventDefault();
      if (process.platform == "darwin") {
        // on macOS window cannot be minimized/hidden if it is already fullscreen
        // so we just close it.
        if (globalThis.window.isFullScreen()) app.exit(0);
        else app.hide();
      } else {
        globalThis.window.minimize();
        globalThis.window.hide();
      }
    }
  });

  globalThis.window.on("minimize", () => {
    if (getDesktopIntegration().minimizeToSystemTray) {
      if (process.platform == "darwin") {
        app.hide();
      } else {
        globalThis.window.hide();
      }
    }
  });

  if (desktopIntegration.autoStart) {
    AutoLaunch.enable(desktopIntegration.startMinimized);
  }
}
