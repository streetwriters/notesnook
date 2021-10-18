const { setTheme } = require("../../config/theme");

module.exports = async (args) => {
  if (!global.win) return;
  const { theme } = args;
  await setTheme(theme);
};
