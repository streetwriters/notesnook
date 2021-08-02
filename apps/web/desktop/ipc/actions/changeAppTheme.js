const { setTheme, getBackgroundColor } = require("../../theme");

module.exports = {
  type: "changeAppTheme",
  action: async (args) => {
    console.log("args", args);
    if (!global.win) return;
    const { theme } = args;
    await setTheme(theme);
    global.win.setBackgroundColor(getBackgroundColor());
  },
};
