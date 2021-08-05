const { logger } = require("../logger");

function sendMessageToRenderer(type, payload = {}) {
  const message = { type, ...payload };
  logger.info("Sending message to renderer", message);
  global.win.webContents.send("fromMain", message);
}

module.exports = { sendMessageToRenderer };
