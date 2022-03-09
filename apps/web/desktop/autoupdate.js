const { autoUpdater } = require("electron-updater");
const { EVENTS } = require("./events");
const { sendMessageToRenderer } = require("./ipc/utils");
const { getChangelog } = require("./changelog");

async function configureAutoUpdater() {
  autoUpdater.setFeedURL({
    provider: "generic",
    url: `https://notesnook.com/releases/${process.platform}/`,
    useMultipleRangeRequest: false,
  });

  autoUpdater.autoDownload = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.addListener("checking-for-update", () => {
    sendMessageToRenderer(EVENTS.checkingForUpdate);
  });
  autoUpdater.addListener("update-available", async (info) => {
    info.releaseNotes = await getChangelog(info.version);
    console.log("Get release notes!", info.releaseNotes);
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
