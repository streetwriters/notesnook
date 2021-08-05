const { setZoomFactor } = require("../../config/zoomfactor");

module.exports = async (args) => {
  if (!global.win) return;
  const { zoomFactor } = args;
  global.win.webContents.setZoomFactor(zoomFactor);
  await setZoomFactor(zoomFactor);
};
