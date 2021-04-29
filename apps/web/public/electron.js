const { app, BrowserWindow, protocol } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const url = require("url");
const os = require("os");
const isDev = require("electron-is-dev");

try {
  require("electron-reloader")(module);
} catch (_) {}

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    icon: path.join(
      __dirname,
      os.platform() === "win32" ? "app.ico" : "favicon-72x72.png"
    ),
  });

  if (isDev)
    mainWindow.webContents.openDevTools({ mode: "right", activate: true });

  mainWindow.maximize();

  // await loadURL(mainWindow);
  mainWindow.loadURL(
    isDev
      ? process.env.ELECTRON_START_URL
      : url.format({
          pathname:
            "index.html" /* Attention here: origin is path.join(__dirname, 'index.html') */,
          protocol: "file",
          slashes: true,
        })
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.commandLine.appendSwitch("lang", "en-US");
app.on("ready", () => {
  protocol.interceptFileProtocol(
    "file",
    (request, callback) => {
      const url = request.url.substr(7); /* all urls start with 'file://' */
      callback({ path: path.normalize(`${__dirname}/${url}`) });
    },
    (err) => {
      if (err) console.error("Failed to register protocol");
    }
  );
  autoUpdater.checkForUpdatesAndNotify().catch((e) => console.log(e));
  createWindow();
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
