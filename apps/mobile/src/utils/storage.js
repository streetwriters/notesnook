import FastStorage from 'react-native-fast-storage';
import {NativeModules, Platform} from 'react-native';
var Aes = NativeModules.Aes;

async function read(key) {
  return await FastStorage.getItem(key);
}

async function write(key, data) {
  return await FastStorage.setItem(key, data);
}

function remove(key) {
  FastStorage.removeItem(key);
}

function clear() {
  FastStorage.clearStore();
}

function encrypt(password, data) {
  let key;
  return Aes.pbkdf2('password', 'salt', 5000, 256).then(aes => {
    key = aes;

    return Aes.randomKey(16).then(iv => {
      return Aes.encrypt(data, key, iv).then(cipher => ({
        cipher,
        iv,
      }));
    });
  });
}

function decrypt(password, data) {
  let key;
  return Aes.pbkdf2(password, 'salt', 5000, 256).then(aes => {
    key = aes;
    console.log(data, key);
    return Aes.decrypt(data.cipher, key, data.iv).then(e => {
      console.log(e);
      return e;
    });
  });
}

export default {read, write, remove, clear, encrypt, decrypt};
