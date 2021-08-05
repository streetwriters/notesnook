const changeAppTheme = require("./changeAppTheme");
const checkForUpdate = require("./checkForUpdate");
const downloadUpdate = require("./downloadUpdate");
const installUpdate = require("./installUpdate");
const openLink = require("./openLink");
const saveFile = require("./saveFile");
const setZoomFactor = require("./setZoomFactor");

const actions = {
  changeAppTheme,
  checkForUpdate,
  downloadUpdate,
  installUpdate,
  openLink,
  saveFile,
  setZoomFactor,
};

module.exports.getAction = function getAction(actionName) {
  try {
    if (!actions[actionName]) throw new Error("Invalid action name.");
  } catch (e) {
    console.error(e);
  }
  return actions[actionName];
};
