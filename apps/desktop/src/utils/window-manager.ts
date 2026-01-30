import { BrowserWindow, app, shell } from "electron";
import { WindowState } from "./window-state";
import { AssetManager } from "./asset-manager";
import { config } from "./config";
import { createIPCHandler } from "electron-trpc/main";
import { router, api } from "../api";
import { setupDesktopIntegration } from "./desktop-integration";
import { setupMenu } from "./menu";
import { setupJumplist } from "./jumplist";
import { isDevelopment } from ".";
import { CLIOptions } from "../cli";
import { PROTOCOL_URL } from "./protocol";
import path from "path";
import { getBackgroundColor, getTheme } from "./theme";

export class WindowManager {
  private windows: Set<BrowserWindow> = new Set();
  private mainWindow: BrowserWindow | null = null;
  private ipcHandler: any = null;
  private noteWindows = new Map<string, BrowserWindow>();

  constructor() {}

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
      cliOptions
    );

    this.mainWindow = win;
    mainWindowState.manage(win);

    // Initial setup for main window
    setupMenu();
    setupJumplist();

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
    routePath = "/"
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
        nodeIntegration: true,
        contextIsolation: false,
        nodeIntegrationInWorker: true,
        spellcheck: config.isSpellCheckerEnabled,
        preload: path.join(__dirname, "preload.js")
      }
    });

    this.windows.add(win);
    if (typeof cliOptions.note === "string") {
      this.noteWindows.set(cliOptions.note, win);
    }

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
}

export const windowManager = new WindowManager();
