const { ipcMain } = require("electron-better-ipc");
const { logger } = require("../logger");
const { getAction } = require("./actions");
const { getCall } = require("./calls");

ipcMain.on("fromRenderer", async (event, args) => {
  logger.info("Action requested by renderer", args);

  const { type } = args;
  const action = getAction(type);
  if (!action) return;
  await action(args);
});

ipcMain.answerRenderer("fromRenderer", async (args, win) => {
  logger.info("Call requested by renderer", args);

  const { type } = args;
  const call = getCall(type);
  if (!call) return;
  return await call(args, win);
});

module.exports.sendMessageToRenderer = function (type, payload = {}) {
  const message = { type, ...payload };
  logger.info("Sending message to renderer", message);
  global.win.webContents.send("fromMain", message);
};
