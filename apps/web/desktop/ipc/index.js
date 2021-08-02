const { ipcMain } = require("electron");
const { getAction } = require("./actions");

ipcMain.on("fromRenderer", async (event, args) => {
  const { type } = args;
  const action = getAction(type);
  if (!action) return;
  await action.action(args);
});

module.exports.sendMessageToRenderer = function (type, payload = {}) {
  global.win.webContents.send("fromMain", {
    type,
    ...payload,
  });
};
