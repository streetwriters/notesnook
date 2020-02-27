import localforage from "localforage";
import CryptoJS from "crypto-js";

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

function encrypt(password, data) {
  return getPBKDF2Key(password, "salt")
    .then(key =>
      CryptoJS.AES.encrypt(data, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })
    )
    .then(encryptedData => ({
      cipher: encryptedData.ciphertext.toString(CryptoJS.enc.Base64),
      iv: encryptedData.iv.toString(CryptoJS.enc.Hex)
    }));
}

function decrypt(password, data) {
  return getPBKDF2Key(password, "salt")
    .then(key =>
      CryptoJS.AES.decrypt(data.cipher, key, {
        iv: CryptoJS.enc.Hex.parse(data.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })
    )
    .then(decryptedText => decryptedText.toString(CryptoJS.enc.Utf8));
}

const params = {
  keySize: 256 / 32,
  hasher: CryptoJS.algo.SHA512,
  iterations: 5000
};

function getPBKDF2Key(password, salt) {
  return new Promise(resolve =>
    resolve(CryptoJS.PBKDF2(password, salt, params))
  );
}

export default {
  read,
  write,
  remove,
  clear,
  encrypt,
  decrypt
};
