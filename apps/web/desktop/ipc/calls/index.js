const getZoomFactor = require("./getZoomFactor");

const calls = {
  getZoomFactor,
};

module.exports.getCall = function getAction(callName) {
  try {
    if (!calls[callName]) throw new Error("Invalid call name.");
  } catch (e) {
    console.error(e);
  }
  return calls[callName];
};
