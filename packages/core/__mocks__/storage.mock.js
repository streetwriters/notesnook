var storage = {};

async function read(key) {
  return new Promise((resolve, reject) => resolve(storage[key]));
}

async function readMulti(keys) {
  return new Promise((resolve, reject) => {
    const result = [];
    keys.forEach(key => {
      result.push([key, storage[key]]);
    });
    resolve(result);
  });
}

async function write(key, data) {
  return new Promise((resolve, reject) => resolve((storage[key] = data)));
}
function remove(key) {
  delete storage[key];
}
function clear() {
  storage = {};
}

function encrypt(password, data) {
  return new Promise((resolve, reject) =>
    resolve({ iv: "some iv", cipher: data })
  );
}
function decrypt(password, data) {
  return new Promise((resolve, reject) => resolve(data.cipher));
}
module.exports = {
  read,
  readMulti,
  write,
  remove,
  clear,
  encrypt,
  decrypt
};
