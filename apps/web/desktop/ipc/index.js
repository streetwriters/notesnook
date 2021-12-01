const { ipcMain } = require("electron");
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

ipcMain.handle("fromRenderer", async (event, args) => {
  logger.info("Call requested by renderer", args);

  const { type } = args;
  const call = getCall(type);
  if (!call) return;

  return await call(args, global.win);
});
