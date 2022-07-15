var nodeCrypto = require("crypto");
var dotenv = require("dotenv");
const fetch = require("node-fetch");
const linkedom = require("linkedom");
globalThis.DOMParser = linkedom.DOMParser;
globalThis.fetch = fetch;
require("abortcontroller-polyfill/dist/polyfill-patch-fetch");

dotenv.config();

global.crypto = nodeCrypto;
