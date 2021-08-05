const { CancellationToken } = require("builder-util-runtime");
const { autoUpdater } = require("electron-updater");
const { EVENTS } = require("../../events");
const { sendMessageToRenderer } = require("../utils");

module.exports = () => {
  sendMessageToRenderer(EVENTS.updateDownloadProgress, { progress: 0 });
  autoUpdater.cancellationToken = new CancellationToken();
  autoUpdater.downloadUpdate(autoUpdater.cancellationToken);
};
