const { version } = require("./package.json");
const fs = require("fs");
const path = require("path");

const APP_VERSION = version;
const CHANGELOG = fs.readFileSync(path.join(__dirname, "changelog.txt"), {
  encoding: "utf8",
});
module.exports = {
  all: {
    REACT_APP_VERSION: APP_VERSION,
    REACT_APP_CHANGELOG: CHANGELOG,
  },
  release: {
    GENERATE_SOURCEMAP: false,
    INLINE_RUNTIME_CHUNK: false,
    DISABLE_ESLINT_PLUGIN: true,
  },
};
