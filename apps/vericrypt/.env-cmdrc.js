const { version } = require("./package.json");

const APP_VERSION = version;
module.exports = {
  all: {
    REACT_APP_VERSION: APP_VERSION,
  },
  release: {
    GENERATE_SOURCEMAP: false,
    INLINE_RUNTIME_CHUNK: false,
    DISABLE_ESLINT_PLUGIN: true,
  },
};
