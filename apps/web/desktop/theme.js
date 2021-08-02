const storage = require("electron-data-storage").default;

function getTheme() {
  return storage.getSync("theme") || "light";
}

function setTheme(theme) {
  return storage.set("theme", theme);
}

function getBackgroundColor() {
  const theme = getTheme();
  console.log("THEME", theme);
  return theme === "dark" ? "#0f0f0f" : "#fff";
}

module.exports = { getTheme, setTheme, getBackgroundColor };
