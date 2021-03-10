const { app, BrowserWindow } = require("electron");
const serve = require("electron-serve");

const loadURL = serve({
  directory: __dirname,
  scheme: "nn",
  isCorsEnabled: false,
});

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
  });

  mainWindow.maximize();

  await loadURL(mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

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
