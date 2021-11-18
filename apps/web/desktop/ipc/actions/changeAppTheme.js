const { setTheme } = require("../../config/theme");

module.exports = (args) => {
  if (!global.win) return;
  const { theme } = args;
  setTheme(theme);
};
