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
import { app, BrowserWindow, Menu, nativeTheme, shell, Tray } from "electron";
import { APP_ICON_PATH, isDevelopment } from "./utils";
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
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { getDesktopIntegration } from "./config/desktopIntegration";
import { AutoLaunch } from "./autolaunch";
import bringToFront from "./ipc/actions/bringToFront";

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
  mainWindowState = new WindowState({});
  setTheme(getTheme());

  const mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    fullscreen: mainWindowState.isFullScreen,

    backgroundColor: getBackgroundColor(),
    autoHideMenuBar: true,
    icon: APP_ICON_PATH,
    webPreferences: {
      zoomFactor: getZoomFactor(),
      devTools: true, // isDev,
      nodeIntegration: false, //true,
      enableRemoteModule: false,
      contextIsolation: true,
      nativeWindowOpen: true,
      spellcheck: getIsSpellCheckerEnabled(),
      preload: __dirname + "/preload.js"
    }
  });

  mainWindow.setAutoHideMenuBar(true);
  mainWindowState.manage(mainWindow);
  globalThis.window = mainWindow;
  setupMenu();
  setupJumplist();
  setupTray();
  setupDesktopIntegration();

  if (isDevelopment())
    mainWindow.webContents.openDevTools({ mode: "right", activate: true });

  if (getPrivacyMode()) {
    setPrivacyMode({ privacyMode: getPrivacyMode() });
  }

  const cliOptions = await parseCli();
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

async function parseCli() {
  const result = {
    note: false,
    notebook: false,
    reminder: false
  };
  await yargs(hideBin(process.argv))
    .command("new", "Create a new item", (yargs) => {
      return yargs
        .command("note", "Create a new note", {}, () => (result.note = true))
        .command(
          "notebook",
          "Create a new notebook",
          {},
          () => (result.notebook = true)
        )
        .command(
          "reminder",
          "Add a new reminder",
          {},
          () => (result.reminder = true)
        );
    })
    .command("open", "Open a specific item", (yargs) => {
      return yargs
        .command(
          "note",
          "Open a note",
          { id: { string: true, description: "Id of the note" } },
          (args) => (result.note = args.id)
        )
        .command(
          "notebook",
          "Open a notebook",
          { id: { string: true, description: "Id of the notebook" } },
          (args) => (result.notebook = args.id)
        )
        .command(
          "topic",
          "Open a topic",
          {
            id: { string: true, description: "Id of the topic" },
            notebookId: { string: true, description: "Id of the notebook" }
          },
          (args) => (result.notebook = `${args.notebookId}/${args.id}`)
        );
    })
    .parse();
  return result;
}

function setupJumplist() {
  if (process.platform === "win32") {
    app.setJumpList([
      { type: "frequent" },
      {
        type: "tasks",
        items: [
          {
            program: process.execPath,
            iconPath: process.execPath,
            args: "new note",
            description: "Create a new note",
            title: "New note",
            type: "task"
          },
          {
            program: process.execPath,
            iconPath: process.execPath,
            args: "new notebook",
            description: "Create a new notebook",
            title: "New notebook",
            type: "task"
          },
          {
            program: process.execPath,
            iconPath: process.execPath,
            args: "new reminder",
            description: "Add a new reminder",
            title: "New reminder",
            type: "task"
          }
        ]
      }
    ]);
  }
}

function setupTray() {
  const tray = new Tray(APP_ICON_PATH);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Notesnook",
      type: "normal",
      icon: APP_ICON_PATH,
      click: bringToFront
    },
    { type: "separator" },
    {
      label: "New note",
      type: "normal",
      click: () => {
        bringToFront();
        sendMessageToRenderer(EVENTS.createItem, { itemType: "note" });
      }
    },
    {
      label: "New notebook",
      type: "normal",
      click: () => {
        bringToFront();
        sendMessageToRenderer(EVENTS.createItem, { itemType: "notebook" });
      }
    },
    { type: "separator" },
    {
      label: "Quit Notesnook",
      type: "normal",
      click: () => {
        app.exit(0);
      }
    }
  ]);
  tray.on("double-click", bringToFront);
  tray.on("click", bringToFront);
  tray.setToolTip("Notesnook");
  tray.setContextMenu(contextMenu);
}

function setupDesktopIntegration() {
  const desktopIntegration = getDesktopIntegration();

  if (desktopIntegration.autoStart) {
    AutoLaunch.enable(desktopIntegration.startMinimized);
  }

  globalThis.window.on("close", (e) => {
    if (getDesktopIntegration().closeToSystemTray) {
      e.preventDefault();
      globalThis.window.minimize();
      globalThis.window.hide();
    }
  });

  globalThis.window.on("minimize", () => {
    if (getDesktopIntegration().minimizeToSystemTray) globalThis.window.hide();
  });
}
