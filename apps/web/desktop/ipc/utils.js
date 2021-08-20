const { logger } = require("../logger");
const { app } = require("electron");
const path = require("path");

function sendMessageToRenderer(type, payload = {}) {
  const message = { type, ...payload };
  logger.info("Sending message to renderer", message);
  global.win.webContents.send("fromMain", message);
}

function resolvePath(_path) {
  return path.join(
    ..._path.split("/").map((segment) => {
      let resolved = segment;
      try {
        resolved = app.getPath(resolved);
      } finally {
        return resolved;
      }
    })
  );
}

module.exports = { resolvePath, sendMessageToRenderer };
