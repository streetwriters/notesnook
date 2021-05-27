const { app, protocol, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const fs = require("fs");
const os = require("os");
const fetch = require("node-fetch").default;
const FILE_NOT_FOUND = -6;

try {
  require("electron-reloader")(module);
} catch (_) {}

const isDev = isDevelopment();
const extensionToMimeType = {
  html: "text/html",
  json: "application/json",
  js: "application/javascript",
  css: "text/css",
  svg: "image/svg+xml",
  png: "image/png",
};

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    icon: path.join(
      __dirname,
      os.platform() === "win32" ? "app.ico" : "favicon-72x72.png"
    ),
    webPreferences: {
      devTools: true, // isDev,
      nodeIntegration: false, //true,
      preload: __dirname + "/preload.js",
    },
  });

  if (isDev)
    mainWindow.webContents.openDevTools({ mode: "right", activate: true });

  mainWindow.maximize();

  // await loadURL(mainWindow);
  mainWindow.loadURL(
    isDev ? process.env.ELECTRON_START_URL : "https://notesnook"
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.commandLine.appendSwitch("lang", "en-US");
app.on("ready", () => {
  protocol.interceptStreamProtocol(
    "https",
    async (request, callback) => {
      const url = new URL(request.url);
      if (url.hostname === "notesnook") {
        const absoluteFilePath = path.normalize(
          `${__dirname}${url.pathname === "/" ? "/index.html" : url.pathname}`
        );
        const filePath = getPath(absoluteFilePath);
        if (!filePath) {
          callback({ error: FILE_NOT_FOUND });
          return;
        }
        const fileExtension = path.extname(filePath).replace(".", "");

        const data = fs.createReadStream(filePath);
        callback({
          data,
          mimeType: extensionToMimeType[fileExtension],
        });
      } else {
        const response = await fetch(request.url, {
          ...request,
          body: !!request.uploadData ? request.uploadData[0].bytes : null,
          headers: { ...request.headers, origin: "https://app.notesnook.com/" },
        });
        callback({
          data: response.body,
          headers: response.headers,
          mimeType: response.headers.get("Content-Type"),
          statusCode: response.status,
        });
      }
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

ipcMain.on("fromRenderer", (event, ...args) => {
  console.log(event, ...args);
});

function isDevelopment() {
  if (typeof electron === "string") {
    throw new TypeError("Not running in an Electron environment!");
  }

  const isEnvSet = "ELECTRON_IS_DEV" in process.env;
  const getFromEnv = Number.parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
  return isEnvSet ? getFromEnv : !app.isPackaged;
}

function getPath(filePath) {
  try {
    const result = fs.statSync(filePath);

    if (result.isFile()) {
      return filePath;
    }

    if (result.isDirectory()) {
      return getPath(path.join(filePath, "index.html"));
    }
  } catch (_) {}
}
