var nodeCrypto = require("crypto");
var jsdom = require("jsdom");

const dom = new jsdom.JSDOM("", {});
global.window = dom.window;
global.document = dom.window.document;
global.crypto = nodeCrypto;
