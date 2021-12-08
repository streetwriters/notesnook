var nodeCrypto = require("crypto");
var dotenv = require("dotenv");

dotenv.config();

global.crypto = nodeCrypto;
