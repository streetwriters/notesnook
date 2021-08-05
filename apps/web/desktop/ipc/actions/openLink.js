const { shell } = require("electron");
module.exports = (args) => {
  const { link } = args;
  return shell.openExternal(link);
};
