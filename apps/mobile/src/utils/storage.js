import {NativeModules} from 'react-native';
import FastStorage from 'react-native-fast-storage';
var Aes = NativeModules.Aes;

async function read(key) {
  let json = await FastStorage.getItem(key);

  return !json ? undefined : JSON.parse(json);
}

async function write(key, data) {
  let json = JSON.stringify(data);
  return await FastStorage.setItem(key, json);
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
    console.log(aes);
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

    return Aes.decrypt(data.cipher, key, data.iv).then(e => {
      return e;
    });
  });
}

export default {read, write, remove, clear, encrypt, decrypt};
