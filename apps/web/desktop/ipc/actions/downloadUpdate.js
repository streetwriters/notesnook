const { CancellationToken } = require("builder-util-runtime");
const { autoUpdater } = require("electron-updater");
const { sendMessageToRenderer } = require("..");
const { EVENTS } = require("../../events");

module.exports = () => {
  sendMessageToRenderer(EVENTS.updateDownloadProgress, { progress: 0 });
  autoUpdater.cancellationToken = new CancellationToken();
  autoUpdater.downloadUpdate(autoUpdater.cancellationToken);
};
