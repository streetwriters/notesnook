const { autoUpdater } = require("electron-updater");

module.exports = {
  type: "installUpdate",
  action: () => {
    autoUpdater.quitAndInstall();
  },
};
