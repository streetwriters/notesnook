const { execSync } = require("child_process");
const { cpus, networkInterfaces } = require("os");
const { version } = require("./package.json");
const ip = require("ip");

const NUM_CPUS = cpus().length;
const IS_CI = process.env.CI;
const gitHash = execSync("git rev-parse --short HEAD").toString().trim();
const APP_VERSION = version.replaceAll(".", "");
console.log("App version:", APP_VERSION);
console.log("Ip address:", ip.address());
module.exports = {
  beta: {
    REACT_APP_BETA: true
  },
  test: {
    TEST_ALL: true
  },
  all: {
    UV_THREADPOOL_SIZE: IS_CI ? NUM_CPUS : 2,
    GENERATE_SOURCEMAP: process.env.NODE_ENV === "development",
    // INLINE_RUNTIME_CHUNK: false,
    // DISABLE_ESLINT_PLUGIN: true,
    REACT_APP_GIT_HASH: gitHash,
    REACT_APP_VERSION: APP_VERSION
  },
  dev: {
    REACT_APP_LOCALHOST: ip.address()
  },
  web: {
    REACT_APP_PLATFORM: "web"
  },
  debug: {
    PWDEBUG: 1,
    DEBUG: "pw:api"
  },
  silent: {
    REACT_APP_TEST: true
    // DISABLE_ESLINT_PLUGIN: "true"
    // FAST_REFRESH: "false",
    // BROWSER: "none"
  },
  desktop: {
    // BROWSER: "none",
    REACT_APP_PLATFORM: "desktop"
  }
};
