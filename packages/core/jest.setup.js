var nodeCrypto = require("crypto");
var dotenv = require("dotenv");
const fetch = require("node-fetch");
const linkedom = require("linkedom");
// const { initalize } = require("./logger");
// const StorageInterface = require("./__mocks__/storage.mock");
// initalize(StorageInterface);

globalThis.DOMParser = linkedom.DOMParser;
globalThis.fetch = fetch;
require("abortcontroller-polyfill/dist/polyfill-patch-fetch");

dotenv.config();

global.crypto = nodeCrypto;
