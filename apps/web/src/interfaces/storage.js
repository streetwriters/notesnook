import localforage from "localforage";
import { encode, decode } from "../utils/base64";
import { hexToBuffer, bufferToHex } from "../utils/hex";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

localforage.config({
  name: "Notesnook",
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE]
});

async function read(key) {
  return localforage.getItem(key);
}
async function write(key, data) {
  return localforage.setItem(key, data);
}
function remove(key) {
  return localforage.removeItem(key);
}
function clear() {
  return localforage.clear();
}

const randArray = new Uint8Array(16);
async function encrypt(password, data) {
  var algo = {
    name: "AES-CBC",
    length: 256,
    iv: crypto.getRandomValues(randArray)
  };
  var key = await getPBKDF2Key(password, "salt");
  var encoded = encoder.encode(data);
  var cipher = await crypto.subtle.encrypt(algo, key, encoded);
  return {
    cipher: encode(cipher),
    iv: bufferToHex(algo.iv)
  };
}

async function decrypt(password, data) {
  var algo = {
    name: "AES-CBC",
    length: 256,
    iv: hexToBuffer(data.iv)
  };
  var key = await getPBKDF2Key(password, "salt");
  var decrypted = await crypto.subtle.decrypt(algo, key, decode(data.cipher));

  return decoder.decode(decrypted);
}

export default {
  read,
  write,
  remove,
  clear,
  encrypt,
  decrypt
};

async function getPBKDF2Key(password, salt) {
  var algo = {
    name: "PBKDF2",
    hash: "SHA-512",
    salt: encoder.encode(salt),
    iterations: 5000
  };
  var derived = { name: "AES-CBC", length: 256 };
  var encoded = encoder.encode(password);
  var key = await crypto.subtle.importKey(
    "raw",
    encoded,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(algo, key, derived, false, [
    "encrypt",
    "decrypt"
  ]);
}
