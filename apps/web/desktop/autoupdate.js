const { autoUpdater } = require("electron-updater");
const { EVENTS } = require("./events");
const { sendMessageToRenderer } = require("./ipc/utils");

async function configureAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.addListener("checking-for-update", () => {
    sendMessageToRenderer(EVENTS.checkingForUpdate);
  });
  autoUpdater.addListener("update-available", (info) => {
    sendMessageToRenderer(EVENTS.updateAvailable, info);
  });
  autoUpdater.addListener("download-progress", (progress) => {
    sendMessageToRenderer(EVENTS.updateDownloadProgress, progress);
  });
  autoUpdater.addListener("update-downloaded", (info) => {
    sendMessageToRenderer(EVENTS.updateDownloadCompleted, info);
  });
  autoUpdater.addListener("update-not-available", (info) => {
    sendMessageToRenderer(EVENTS.updateNotAvailable, info);
  });
}

module.exports = { configureAutoUpdater };
