const JSONStorage = require("../jsonstorage");

function getZoomFactor() {
  let factor = parseFloat(JSONStorage.get("zoomFactor"));
  return isNaN(factor) ? 1.0 : factor;
}

function setZoomFactor(factor) {
  return JSONStorage.set("zoomFactor", factor.toString());
}

module.exports = { setZoomFactor, getZoomFactor };
