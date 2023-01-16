/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
      key: password
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
  hash
};
