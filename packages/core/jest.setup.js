var nodeCrypto = require("crypto");
var jsdom = require("jsdom");
var dotenv = require("dotenv");

dotenv.config();

const dom = new jsdom.JSDOM("", {});
global.window = dom.window;
global.document = dom.window.document;
global.crypto = nodeCrypto;

global.HTMLParser = new dom.window.DOMParser().parseFromString(
  "<body></body>",
  "text/html"
);
