const dom = require("jsdom");

global.window = new dom.JSDOM("", {}).window;

const text = require("./providers/plaintext");
const html = require("./providers/html");
const markdown = require("./providers/markdown");
const evernote = require("./providers/evernote");
const simplenote = require("./providers/simplenote");

module.exports = {
  text,
  html,
  markdown,
  evernote,
  simplenote
};
