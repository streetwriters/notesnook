const { autoUpdater } = require("electron-updater");

module.exports = {
  type: "checkForUpdate",
  action: () => {
    autoUpdater.checkForUpdates();
  },
};
