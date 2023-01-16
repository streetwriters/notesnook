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
import { join } from "path";
import { platform } from "os";
import { isDevelopment } from "./utils";
import { registerProtocol, PROTOCOL_URL } from "./protocol";
import { configureAutoUpdater } from "./autoupdate";
import { getBackgroundColor, getTheme, setTheme } from "./config/theme";
import getZoomFactor from "./ipc/calls/getZoomFactor";
import { logger } from "./logger";
import { setupMenu } from "./menu";
import { WindowState } from "./config/windowstate";
import { sendMessageToRenderer } from "./ipc/utils";
import { EVENTS } from "./events";
import "./ipc/index.js";
import getPrivacyMode from "./ipc/calls/getPrivacyMode";

if (!RELEASE) {
  require("electron-reloader")(module);
}

// only run a single instance

if (!MAC_APP_STORE && !app.requestSingleInstanceLock()) {
  app.exit();
}

/**
 * @type {BrowserWindow}
 */
let mainWindow;

async function createWindow() {
  const mainWindowState = new WindowState({});
  setTheme(getTheme());
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    backgroundColor: getBackgroundColor(),
    autoHideMenuBar: true,
    icon: join(
      __dirname,
      platform() === "win32" ? "app.ico" : "favicon-72x72.png"
    ),
    webPreferences: {
      zoomFactor: getZoomFactor(),
      devTools: true, // isDev,
      nodeIntegration: false, //true,
      enableRemoteModule: false,
      contextIsolation: true,
      nativeWindowOpen: true,
      spellcheck: false,
      preload: __dirname + "/preload.js"
    }
  });
  mainWindowState.manage(mainWindow);
  global.win = mainWindow;
  setupMenu(mainWindow);

  if (isDevelopment())
    mainWindow.webContents.openDevTools({ mode: "right", activate: true });

  if (getPrivacyMode()) {
    global.win.setContentProtection(true);
  }

  try {
    await mainWindow.loadURL(
      isDevelopment() ? "http://localhost:3000" : PROTOCOL_URL
    );
  } catch (e) {
    logger.error(e);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    global.win = null;
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  nativeTheme.on("updated", () => {
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
  if (mainWindow === null) {
    createWindow();
  }
});
