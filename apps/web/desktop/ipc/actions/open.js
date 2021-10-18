const { shell } = require("electron");
const { resolvePath } = require("../utils");
module.exports = (args) => {
  const { link, linkType } = args;
  if (linkType === "path") return shell.openPath(resolvePath(link));
};
