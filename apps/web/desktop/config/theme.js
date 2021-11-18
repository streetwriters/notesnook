const JSONStorage = require("../jsonstorage");
const { nativeTheme } = require("electron");

function getTheme() {
  return JSONStorage.get("theme") || "light";
}

function setTheme(theme) {
  nativeTheme.themeSource = theme;
  if (global.win) global.win.setBackgroundColor(getBackgroundColor(theme));
  return JSONStorage.set("theme", theme);
}

function getBackgroundColor(theme) {
  if (!theme) theme = getTheme();
  return theme === "dark" ? "#0f0f0f" : "#ffffff";
}

module.exports = { getTheme, setTheme, getBackgroundColor };
