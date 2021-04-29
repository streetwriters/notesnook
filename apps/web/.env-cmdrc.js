const { execSync } = require("child_process");

const gitHash = execSync("git rev-parse --short HEAD").toString().trim();
module.exports = {
  all: {
    REACT_APP_GIT_HASH: gitHash,
  },
  dev: {
    REACT_APP_CI: true,
  },
  web: {
    REACT_APP_PLATFORM: "web",
  },
  desktop: {
    BROWSER: "none",
    REACT_APP_PLATFORM: "desktop",
  },
};
