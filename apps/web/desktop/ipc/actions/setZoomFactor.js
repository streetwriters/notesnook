const { setZoomFactor } = require("../../config/zoomfactor");

module.exports = (args) => {
  if (!global.win) return;
  const { zoomFactor } = args;
  global.win.webContents.setZoomFactor(zoomFactor);
  setZoomFactor(zoomFactor);
};
