const { app } = require("electron");
const { diary, enable, defaultReporter } = require("diary");
const fs = require("fs");
const path = require("path");

enable("native");

const LOG_FILE_PATH = path.join(app.getPath("logs"), "notesnook.log");
const logFileStream = fs.createWriteStream(LOG_FILE_PATH, {
  autoClose: true,
  flags: "a",
});

const native = diary("native", (e) => {
  defaultReporter(e);
  logFileReporter(e);
});

function logFileReporter(e) {
  const time = new Date().toLocaleString("en", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const extra = e.extra.map((ex) => JSON.stringify(ex)).join(" ");
  let str = `[${time}] | ${e.level} | ${e.message} ${extra}\n`;
  logFileStream.write(str);
}

module.exports.logger = native;
