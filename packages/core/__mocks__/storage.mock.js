var storage = {};

async function read(key) {
  return new Promise((resolve) => resolve(storage[key]));
}

async function readMulti(keys) {
  return new Promise((resolve) => {
    const result = [];
    keys.forEach((key) => {
      result.push([key, storage[key]]);
    });
    resolve(result);
  });
}

async function write(key, data) {
  return new Promise((resolve) => resolve((storage[key] = data)));
}
function remove(key) {
  delete storage[key];
}
function clear() {
  storage = {};
}
function getAllKeys() {
  return Object.keys(storage);
}

function encrypt(password, data) {
  return new Promise((resolve, reject) => {
    if (typeof data === "object") reject("data cannot be object.");
    resolve({
      iv: "some iv",
      cipher: data,
      salt: "i am some salt",
      length: data.length,
      key: password,
    });
  });
}

function decrypt(key, data) {
  if (
    !key ||
    !data.key ||
    key.password === data.key.password ||
    key.key.password === data.key.password
  )
    return Promise.resolve(data.cipher);
  else throw new Error("Wrong password");
}

async function deriveCryptoKey(name, data) {
  storage[name] = { key: data.password, salt: "salt" };
}

async function getCryptoKey(name) {
  return storage[name].key;
}

async function hash(password) {
  return password;
}

async function generateCryptoKey(password, salt) {
  return { password, salt };
}

module.exports = {
  read,
  readMulti,
  write,
  remove,
  clear,
  encrypt,
  decrypt,
  deriveCryptoKey,
  generateCryptoKey,
  getCryptoKey,
  getAllKeys,
  hash,
};
