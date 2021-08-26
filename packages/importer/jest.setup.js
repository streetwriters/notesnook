var jsdom = require("jsdom");

const dom = new jsdom.JSDOM("", {});
global.window = dom.window;
global.document = dom.window.document;
