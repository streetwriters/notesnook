const { app, BrowserWindow } = require("electron");
const path = require("path");
const os = require("os");
const { isDevelopment } = require("./utils");
const { registerProtocol, URL } = require("./protocol");
const { configureAutoUpdater } = require("./autoupdate");
const { getBackgroundColor, getTheme, setTheme } = require("./config/theme");
const getZoomFactor = require("./ipc/calls/getZoomFactor");
const { logger } = require("./logger");
require("./ipc/index.js");
try {
  require("electron-reloader")(module);
} catch (_) {}

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    backgroundColor: getBackgroundColor(),
    darkTheme: getTheme() === "dark",
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
      preload: __dirname + "/preload.js",
    },
  });
  global.win = mainWindow;
  setTheme(getTheme());

  if (isDevelopment())
    mainWindow.webContents.openDevTools({ mode: "right", activate: true });

  mainWindow.maximize();

  try {
    await mainWindow.loadURL(isDevelopment() ? "http://localhost:3000" : URL);
  } catch (e) {
    logger.error(e);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
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
