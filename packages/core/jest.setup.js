var nodeCrypto = require("crypto");
var jsdom = require("jsdom");

process.env.NODE_ENV = "testing";

const dom = new jsdom.JSDOM("", {});
global.window = dom.window;
global.document = dom.window.document;
global.crypto = nodeCrypto;
