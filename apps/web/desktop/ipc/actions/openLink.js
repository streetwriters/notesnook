const { shell } = require("electron");
module.exports = {
  type: "openLink",
  action: (args) => {
    const { link } = args;
    return shell.openExternal(link);
  },
};
