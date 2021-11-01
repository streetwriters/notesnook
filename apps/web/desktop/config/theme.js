const { default: storage } = require("electron-data-storage");
const { nativeTheme } = require("electron");

function getTheme() {
  return storage.getSync("theme") || "light";
}

function setTheme(theme) {
  nativeTheme.themeSource = theme;
  if (global.win) global.win.setBackgroundColor(getBackgroundColor(theme));
  return storage.set("theme", theme);
}

function getBackgroundColor(theme) {
  if (!theme) theme = getTheme();
  return theme === "dark" ? "#0f0f0f" : "#ffffff";
}

module.exports = { getTheme, setTheme, getBackgroundColor };
