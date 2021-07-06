const actions = {};

module.exports.getAction = function getAction(actionName) {
  try {
    if (!actions[actionName]) actions[actionName] = require(`./${actionName}`);
  } catch (e) {
    console.error(e);
  }
  return actions[actionName];
};
