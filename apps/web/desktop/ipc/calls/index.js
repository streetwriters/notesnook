const getZoomFactor = require("./getZoomFactor");
const selectDirectory = require("./selectDirectory");

const calls = {
  getZoomFactor,
  selectDirectory
};

module.exports.getCall = function getAction(callName) {
  try {
    if (!calls[callName]) throw new Error("Invalid call name.");
  } catch (e) {
    console.error(e);
  }
  return calls[callName];
};
