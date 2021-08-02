const { app, BrowserWindow } = require("electron");
const path = require("path");
const os = require("os");
const { isDevelopment } = require("./utils");
const { registerProtocol, URL } = require("./protocol");
const { configureAutoUpdater } = require("./autoupdate");
const { getTheme, getBackgroundColor } = require("./theme");
require("./ipc/index.js");
try {
  require("electron-reloader")(module);
} catch (_) {}

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    backgroundColor: getBackgroundColor(),
    autoHideMenuBar: true,
    icon: path.join(
      __dirname,
      os.platform() === "win32" ? "app.ico" : "favicon-72x72.png"
    ),
    webPreferences: {
      devTools: true, // isDev,
      nodeIntegration: false, //true,
      enableRemoteModule: false,
      contextIsolation: true,
      sandbox: true,
      preload: __dirname + "/preload.js",
    },
  });

  if (isDevelopment())
    mainWindow.webContents.openDevTools({ mode: "right", activate: true });

  mainWindow.maximize();

  await mainWindow.loadURL(
    isDevelopment() ? process.env.ELECTRON_START_URL : URL
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  global.win = mainWindow;
}

app.commandLine.appendSwitch("lang", "en-US");
app.on("ready", async () => {
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
