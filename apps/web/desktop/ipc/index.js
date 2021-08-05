const { ipcMain } = require("electron-better-ipc");
const { getAction } = require("./actions");
const { getCall } = require("./calls");

ipcMain.on("fromRenderer", async (event, args) => {
  const { type } = args;
  const action = getAction(type);
  if (!action) return;
  await action(args);
});

ipcMain.answerRenderer("fromRenderer", async (args, win) => {
  const { type } = args;
  const call = getCall(type);
  if (!call) return;
  return await call(args, win);
});

module.exports.sendMessageToRenderer = function (type, payload = {}) {
  global.win.webContents.send("fromMain", {
    type,
    ...payload,
  });
};
