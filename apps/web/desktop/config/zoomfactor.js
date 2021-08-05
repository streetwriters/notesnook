const storage = require("electron-data-storage").default;

function getZoomFactor() {
  let factor = parseFloat(storage.getSync("zoomFactor"));
  return isNaN(factor) ? 1.0 : factor;
}

function setZoomFactor(factor) {
  return storage.set("zoomFactor", factor.toString());
}

module.exports = { setZoomFactor, getZoomFactor };
