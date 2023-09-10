module.exports = {
  all: {
    DISABLE_ESLINT_PLUGIN: true,
    GENERATE_SOURCEMAP: process.env.NODE_ENV === "development",
    BROWSER: "none"
  }
};
