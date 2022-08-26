require("isomorphic-fetch");
const { app, BrowserWindow, nativeTheme, shell } = require("electron");
const path = require("path");
const os = require("os");
const { isDevelopment } = require("./utils");
const { registerProtocol, URL } = require("./protocol");
const { configureAutoUpdater } = require("./autoupdate");
const { getBackgroundColor, getTheme, setTheme } = require("./config/theme");
const getZoomFactor = require("./ipc/calls/getZoomFactor");
const { logger } = require("./logger");
const { setupMenu } = require("./menu");
const WindowState = require("./config/windowstate");
const { sendMessageToRenderer } = require("./ipc/utils");
const { EVENTS } = require("./events");

require("./ipc/index.js");
try {
  require("electron-reloader")(module);
} catch (_) {}

// only run a single instance
if (!app.requestSingleInstanceLock()) {
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
    icon: path.join(
      __dirname,
      os.platform() === "win32" ? "app.ico" : "favicon-72x72.png"
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

  try {
    await mainWindow.loadURL(isDevelopment() ? "http://localhost:3000" : URL);
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
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
