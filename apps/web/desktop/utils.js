const { app } = require("electron");
const path = require("path");
const fs = require("fs");

function isDevelopment() {
  if (typeof electron === "string") {
    throw new TypeError("Not running in an Electron environment!");
  }

  const isEnvSet = "ELECTRON_IS_DEV" in process.env;
  const getFromEnv = Number.parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
  return isEnvSet ? getFromEnv : !app.isPackaged;
}

function getPath(filePath) {
  try {
    const result = fs.statSync(filePath);

    if (result.isFile()) {
      return filePath;
    }

    if (result.isDirectory()) {
      return getPath(path.join(filePath, "index.html"));
    }
  } catch (_) {}
}

module.exports = { getPath, isDevelopment };
