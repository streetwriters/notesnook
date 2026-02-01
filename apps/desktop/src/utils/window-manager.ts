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

import { BrowserWindow, app, shell, screen } from "electron";
import { WindowState } from "./window-state";
import { AssetManager } from "./asset-manager";
import { config } from "./config";
import { createIPCHandler } from "electron-trpc/main";
import { router } from "../api";
import { setupMenu } from "./menu";
import { setupJumplist } from "./jumplist";
import { isDevelopment } from ".";
import { CLIOptions } from "../cli";
import { PROTOCOL_URL } from "./protocol";
import path from "path";
import { getBackgroundColor, getTheme } from "./theme";
import { randomUUID } from "crypto";

import { JSONStorage } from "./json-storage";

type NoteSessionData = {
  type: "note";
  noteId: string;
  bounds: Electron.Rectangle;
};

type WindowSessionData = {
  type: "window";
  sessionId: string;
  noteId?: string;
  bounds: Electron.Rectangle;
};

type SessionData = NoteSessionData | WindowSessionData;

export class WindowManager {
  private windows: Set<BrowserWindow> = new Set();
  private mainWindow: BrowserWindow | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ipcHandler: any = null;
  private noteWindows = new Map<string, BrowserWindow>();
  private dragWindow: BrowserWindow | null = null;
  private dragInterval: NodeJS.Timeout | null = null;
  private windowSessions = new Map<number, string>();

  constructor() {
    // Save session on app quit
    app.on("before-quit", () => {
      this.saveSession();
    });
  }

  saveSession() {
    const sessionData: SessionData[] = [];
    this.windows.forEach((win) => {
      // Don't save main window session as it's handled separately
      // Don't save destroyed windows
      if (win !== this.mainWindow && !win.isDestroyed()) {
        const bounds = win.getBounds();
        const sessionId = this.windowSessions.get(win.id);
        if (sessionId) {
          let noteId: string | undefined;
          for (const [id, w] of this.noteWindows.entries()) {
            if (w === win) {
              noteId = id;
              break;
            }
          }

          sessionData.push({
            type: "window",
            sessionId,
            noteId,
            bounds
          });
        }
      }
    });
    JSONStorage.set("appSession", sessionData);
  }

  async restoreSession() {
    const sessionData = JSONStorage.get<SessionData[]>("appSession", []);
    if (sessionData && Array.isArray(sessionData)) {
      for (const winData of sessionData) {
        if (winData.type === "note" && winData.noteId) {
          // Legacy support for old session data
          this.createWindow(
            {
              ...winData.bounds,
              hidden: false
            },
            {
              note: winData.noteId,
              notebook: false,
              reminder: false,
              hidden: false
            }
          );
        } else if (winData.type === "window" && winData.sessionId) {
          this.createWindow(
            {
              ...winData.bounds,
              hidden: false
            },
            {
              note: winData.noteId || false,
              notebook: false,
              reminder: false,
              hidden: false
            },
            "/",
            winData.sessionId
          );
        }
      }
    }
  }

  getMainWindow() {
    return this.mainWindow;
  }

  getWindows() {
    return Array.from(this.windows);
  }

  async createMainWindow(cliOptions: CLIOptions) {
    const mainWindowState = new WindowState({});
    const win = this.createWindow(
      {
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        hidden: cliOptions.hidden
      },
      cliOptions,
      "/",
      "main"
    );

    this.mainWindow = win;
    mainWindowState.manage(win);

    // Initial setup for main window
    setupMenu();
    setupJumplist();

    this.restoreSession();

    return win;
  }

  // ... (existing code, ensure previous methods are preserved if not modified)

  createWindow(
    options: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      hidden?: boolean;
    } = {},
    cliOptions: CLIOptions = {
      note: false,
      notebook: false,
      reminder: false,
      hidden: false
    },
    routePath = "/",
    sessionId?: string
  ) {
    if (typeof cliOptions.note === "string") {
      const existingWindow = this.noteWindows.get(cliOptions.note);
      if (existingWindow) {
        if (existingWindow.isMinimized()) existingWindow.restore();
        existingWindow.focus();
        return existingWindow;
      }
    }

    const win = new BrowserWindow({
      show: !options.hidden,
      paintWhenInitiallyHidden: options.hidden,
      skipTaskbar: options.hidden,
      x: options.x,
      y: options.y,
      width: options.width || 1024,
      height: options.height || 700,
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
            titleBarStyle:
              process.platform === "win32" || process.platform === "darwin"
                ? "hidden"
                : "default",
            frame:
              process.platform === "win32" || process.platform === "darwin",
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
        nodeIntegration: false,
        contextIsolation: true,
        nodeIntegrationInWorker: true,
        spellcheck: config.isSpellCheckerEnabled,
        preload: path.join(__dirname, "preload.js")
      }
    });

    this.windows.add(win);
    if (typeof cliOptions.note === "string") {
      this.noteWindows.set(cliOptions.note, win);
    }
    const finalSessionId = sessionId || randomUUID();
    this.windowSessions.set(win.id, finalSessionId);

    if (!this.ipcHandler) {
      this.ipcHandler = createIPCHandler({
        router,
        createContext: async (opts) => {
          return {
            event: opts.event,
            window: BrowserWindow.fromWebContents(opts.event.sender)
          };
        }
      });
    }
    this.ipcHandler.attachWindow(win);

    if (options.hidden && !config.desktopSettings.minimizeToSystemTray) {
      win.minimize();
    }

    const url = this.createURL(cliOptions, routePath);
    url.searchParams.append("windowSessionId", finalSessionId);
    win.webContents.loadURL(url.toString());

    win.webContents.on("did-finish-load", () => {
      win.setOpacity(1);
    });

    if (config.privacyMode) {
      // API call might need to happen per window or globally?
      // api.integration.setPrivacyMode is probably global implementation but sent via TRPC
    }

    win.webContents.session.setPermissionRequestHandler(
      (webContents, permission, callback) => {
        callback(permission === "geolocation" ? false : true);
      }
    );

    win.webContents.session.setSpellCheckerDictionaryDownloadURL(
      "http://dictionaries.notesnook.com/"
    );
    win.webContents.session.setProxy({ proxyRules: config.proxyRules });

    win.once("closed", () => {
      this.windows.delete(win);
      if (typeof cliOptions.note === "string") {
        this.noteWindows.delete(cliOptions.note);
      }
      this.windowSessions.delete(win.id);
      if (win === this.mainWindow) {
        this.mainWindow = null;
      }
    });

    if (isDevelopment())
      win.webContents.openDevTools({ mode: "bottom", activate: true });

    win.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: "deny" };
    });

    return win;
  }

  private createURL(options: CLIOptions, routePath = "/") {
    const url = new URL(
      isDevelopment() ? "http://localhost:3000" : PROTOCOL_URL
    );
    url.pathname = routePath;

    if (options.note === true) {
      url.hash = "/notes/create/1";
      url.searchParams.append("singleNote", "true");
    } else if (options.notebook === true) url.hash = "/notebooks/create";
    else if (options.reminder === true) url.hash = "/reminders/create";
    else if (typeof options.note === "string") {
      url.hash = `/notes/${options.note}/edit`;
      url.searchParams.append("singleNote", "true");
    } else if (typeof options.notebook === "string")
      url.hash = `/notebooks/${options.notebook}`;

    return url;
  }

  startDragSession(
    title: string,
    colors: { bg: string; fg: string; border: string } = {
      bg: getTheme() === "dark" ? "#333" : "#fff",
      fg: getTheme() === "dark" ? "#fff" : "#000",
      border: getTheme() === "dark" ? "#555" : "#ccc"
    }
  ) {
    if (this.dragWindow) {
      this.endDragSession();
    }

    const cursor = screen.getCursorScreenPoint();
    const width = 200;
    const height = 45;

    this.dragWindow = new BrowserWindow({
      x: Math.round(cursor.x - width / 2),
      y: Math.round(cursor.y - height / 2),
      width,
      height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
      focusable: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.dragWindow.on("ready-to-show", () => {
      this.dragWindow?.showInactive();
    });

    this.dragWindow.setAlwaysOnTop(true, "screen-saver");

    const safeTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const html = `
      <html>
        <body style="background: transparent; margin: 0; padding: 4px; height: 100vh; display: flex; align-items: center; box-sizing: border-box; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="
            background: ${colors.bg};
            color: ${colors.fg};
            border: 1px solid ${colors.border || "transparent"};
            border-radius: 8px;
            padding: 0 12px;
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            height: 36px;
            width: 100%;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          ">
            ${safeTitle}
          </div>
        </body>
      </html>
    `;

    // We use a simple data URL for the drag image
    this.dragWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );

    this.dragWindow.setIgnoreMouseEvents(true);

    this.dragInterval = setInterval(() => {
      if (!this.dragWindow || this.dragWindow.isDestroyed()) {
        this.endDragSession();
        return;
      }

      const point = screen.getCursorScreenPoint();
      try {
        this.dragWindow.setPosition(
          Math.round(point.x - width / 2),
          Math.round(point.y - height / 2)
        );
      } catch (e) {
        // console.error("[WindowManager] Error setting position:", e);
      }

      // Check if we are over any of our app windows
      const mainWin = this.getMainWindow();
      if (mainWin && !mainWin.isDestroyed()) {
        // Use isOverMain if needed for other logic, but for now we just ensuring visibility
        if (!this.dragWindow.isVisible()) {
          this.dragWindow.showInactive();
        }
      }
    }, 16); // ~60fps
  }

  endDragSession() {
    if (this.dragInterval) {
      clearInterval(this.dragInterval);
      this.dragInterval = null;
    }

    if (this.dragWindow) {
      if (!this.dragWindow.isDestroyed()) {
        this.dragWindow.destroy();
      }
      this.dragWindow = null;
    }
  }
  handleExternalDrop(
    payload: {
      x: number;
      y: number;
      type: "tab" | "note";
      id: string;
    },
    excludeWindowId: number
  ) {
    const { x, y } = payload;
    for (const window of this.getWindows()) {
      if (window.isDestroyed() || window.id === excludeWindowId) continue;
      const bounds = window.getBounds();
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        if (!this.ipcHandler) return { handled: false };

        // Let's send the event to that window
        window.webContents.send("app:external-drop", payload);
        return { handled: true };
      }
    }
    return { handled: false };
  }
}

export const windowManager = new WindowManager();
