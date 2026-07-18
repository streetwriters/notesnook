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
          // Legacy support for old session data — these were true single-note
          // windows, so preserve that behavior.
          this.createWindow(
            {
              ...winData.bounds,
              hidden: false
            },
            {
              note: winData.noteId,
              notebook: false,
              reminder: false,
              hidden: false,
              singleNote: true
            }
          );
        } else if (winData.type === "window" && winData.sessionId) {
          // Restored multi-tab window. If it had a note open, open that note as
          // the first tab via the hash route instead of forcing single-note
          // semantics.
          const routePath = winData.noteId
            ? `/notes/${winData.noteId}/edit`
            : "/";
          this.createWindow(
            {
              ...winData.bounds,
              hidden: false
            },
            {
              note: false,
              notebook: false,
              reminder: false,
              hidden: false
            },
            routePath,
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

  /**
   * Returns true if the given screen-space point is inside any of the app's
   * non-destroyed windows (main window + note windows). Used by the drag
   * session to decide whether the drag overlay should be visible.
   */
  private isPointOverAppWindow(point: Electron.Point): boolean {
    for (const win of this.windows) {
      if (win.isDestroyed()) continue;
      const bounds = win.getBounds();
      if (
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height
      ) {
        return true;
      }
    }
    return false;
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

    win.webContents.on("will-navigate", (event, url) => {
      try {
        const parsedUrl = new URL(url);
        const appHostnames = isDevelopment()
          ? ["localhost", "127.0.0.1"]
          : ["app.notesnook.com"];
        if (!appHostnames.includes(parsedUrl.hostname)) {
          event.preventDefault();
          shell.openExternal(url);
        }
      } catch (e) {
        console.error("will-navigate: failed to parse URL", url, e);
        event.preventDefault();
      }
    });

    return win;
  }

  private createURL(options: CLIOptions, routePath = "/") {
    const url = new URL(
      isDevelopment() ? "http://localhost:3000" : PROTOCOL_URL
    );
    // The web app uses hash-based routing, so `routePath` (e.g.
    // `/notes/:id/edit`) is written to `url.hash`, not `url.pathname`. The
    // pathname stays "/" so the dev/prod server serves the SPA shell.
    url.pathname = "/";

    // `singleNote` is an explicit opt-in: only windows that are meant to be
    // pinned to a single note (e.g. "Open in new window" from the note menu)
    // set it. Regular multi-tab windows — including tear-out — do not, so
    // they get a normal tab strip and multi-tab behavior.
    const isSingleNote = options.singleNote === true;

    if (isSingleNote) {
      if (options.note === true) {
        url.hash = "/notes/create/1";
      } else if (typeof options.note === "string") {
        url.hash = `/notes/${options.note}/edit`;
      } else {
        url.hash = routePath;
      }
      url.searchParams.append("singleNote", "true");
    } else if (options.notebook === true) {
      url.hash = "/notebooks/create";
    } else if (options.reminder === true) {
      url.hash = "/reminders/create";
    } else if (typeof options.notebook === "string") {
      url.hash = `/notebooks/${options.notebook}`;
    } else if (typeof options.reminder === "string") {
      url.hash = `/reminders/${options.reminder}`;
    } else {
      // For the multi-tab case the caller already encoded the requested note
      // (if any) into routePath as a `/notes/:id/edit` hash, so we use it
      // directly. This lets the renderer open the note as the first tab of a
      // normal multi-tab window instead of forcing single-note semantics.
      url.hash = routePath;
    }

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

    // `forward: true` is required on macOS so the screen-saver-level overlay
    // does not swallow pointer events. Without it, the alwaysOnTop dragWindow
    // intercepts pointermove events, which breaks dnd-kit's PointerSensor and
    // prevents drop zones (splits) from being detected — `over` stays null and
    // handleDragEnd returns early before the split logic runs.
    this.dragWindow.setIgnoreMouseEvents(true, { forward: true });

    this.dragInterval = setInterval(() => {
      if (!this.dragWindow || this.dragWindow.isDestroyed()) {
        this.endDragSession();
        return;
      }

      const point = screen.getCursorScreenPoint();

      // Determine whether the cursor is over any of the app's windows.
      // The drag overlay must NOT be shown while the cursor is inside an app
      // window: on macOS the alwaysOnTop (screen-saver) overlay would block
      // pointermove events from reaching the underlying window's renderer,
      // which freezes dnd-kit's PointerSensor. The result is that drop zones
      // (splits) are never detected — dropping a note just opens it instead
      // of splitting the pane. We only need the overlay for the tear-out
      // affordance when the cursor leaves the app windows.
      const isOverAppWindow = this.isPointOverAppWindow(point);

      try {
        this.dragWindow.setPosition(
          Math.round(point.x - width / 2),
          Math.round(point.y - height / 2)
        );
      } catch (e) {
        // console.error("[WindowManager] Error setting position:", e);
      }

      if (isOverAppWindow) {
        // Hide the overlay so the underlying window receives pointer events.
        if (this.dragWindow.isVisible()) {
          this.dragWindow.hide();
        }
      } else {
        // Cursor is outside all app windows — show the tear-out drag overlay.
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

  /**
   * Broadcast an IPC event to all windows except the one that originated it.
   * Used for cross-window notifications (e.g. note content changes).
   */
  broadcastToWindows(
    channel: string,
    payload: unknown,
    excludeWindowId?: number
  ) {
    for (const window of this.windows) {
      if (window.isDestroyed()) continue;
      if (excludeWindowId && window.id === excludeWindowId) continue;
      window.webContents.send(channel, payload);
    }
  }

  /**
   * Returns metadata for every other app window (excluding the one with the
   * given id). Used by the renderer to populate the "Move tab to window"
   * submenu. The title is derived from the window's webContents title (which
   * the renderer keeps in sync with the active note title) so users can tell
   * windows apart.
   */
  listOtherWindows(excludeWindowId: number) {
    const result: { id: number; sessionId: string; title: string }[] = [];
    for (const window of this.windows) {
      if (window.isDestroyed() || window.id === excludeWindowId) continue;
      const sessionId = this.windowSessions.get(window.id);
      if (!sessionId) continue;
      let title = "Notesnook";
      try {
        const docTitle = window.getTitle();
        if (docTitle) title = docTitle;
      } catch {
        // ignore
      }
      result.push({ id: window.id, sessionId, title });
    }
    return result;
  }

  /**
   * Moves a tab's note to an existing window (identified by its
   * windowSessionId) or, when no targetSessionId is provided, creates a new
   * window with the note opened as its first tab. Returns true when an
   * existing window handled the move, false when a new window was created.
   */
  moveTabToWindow(
    noteId: string,
    targetSessionId: string | undefined,
    sourceWindowId: number
  ): boolean {
    if (targetSessionId) {
      for (const window of this.windows) {
        if (window.isDestroyed() || window.id === sourceWindowId) continue;
        const sessionId = this.windowSessions.get(window.id);
        if (sessionId !== targetSessionId) continue;
        window.webContents.send("app:open-note", { noteId });
        if (window.isMinimized()) window.restore();
        window.focus();
        return true;
      }
      // Fall through to creating a new window if the target vanished.
    }

    // No existing target — create a new multi-tab window with the note open.
    this.createWindow(
      {},
      {
        note: false,
        notebook: false,
        reminder: false,
        hidden: false,
        singleNote: false
      },
      `/notes/${noteId}/edit`
    );
    return false;
  }
}

export const windowManager = new WindowManager();
