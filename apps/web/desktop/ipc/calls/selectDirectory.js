const { dialog } = require("electron");
const { resolvePath } = require("../utils");

module.exports = async function (args, win) {
  const { title, buttonLabel, defaultPath } = args;

  const result = await dialog.showOpenDialog(win, {
    title,
    buttonLabel,
    properties: ["openDirectory"],
    defaultPath: resolvePath(defaultPath),
  });
  if (result.canceled) return;

  return result.filePaths[0];
};
