const { dialog } = require("electron");
const { resolvePath } = require("../utils");

module.exports = function (args, win) {
  const { title, buttonLabel, defaultPath } = args;

  const paths = dialog.showOpenDialogSync(win, {
    title,
    buttonLabel,
    properties: ["openDirectory"],
    defaultPath: resolvePath(defaultPath),
  });
  return !paths ? undefined : paths[0];
};
