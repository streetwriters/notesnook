const { autoUpdater } = require("electron-updater");

module.exports = () => {
  autoUpdater.checkForUpdates();
};
