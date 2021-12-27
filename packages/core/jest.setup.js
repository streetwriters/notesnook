var nodeCrypto = require("crypto");
var dotenv = require("dotenv");
const fetch = require("node-fetch");
globalThis.fetch = fetch;
require("abortcontroller-polyfill/dist/polyfill-patch-fetch")

dotenv.config();

global.crypto = nodeCrypto;
