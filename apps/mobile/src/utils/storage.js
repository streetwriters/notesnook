import {NativeModules} from 'react-native';
import MMKV from 'react-native-mmkv-storage';

var Aes = NativeModules.Aes;

async function read(key, isArray = false) {
  let data;
  if (isArray) {
    data = await MMKV.getArray(key);
  } else {
    data = await MMKV.getMap(key);
  }

  return isArray ? data.slice() : data;
}

async function write(key, data) {
  if (data.length !== undefined) {
    return await MMKV.setArray(key, data.slice());
  } else {
    return await MMKV.setMap(key, data);
  }
}

async function readMulti(keys) {
  if (keys.length <= 0) {
    return [];
  } else {
    let data = await MMKV.getMultipleItems(keys.slice());
    return !data ? undefined : data;
  }
}

function remove(key) {
  MMKV.removeItem(key);
}

function clear() {
  MMKV.clearStore();
}

function encrypt(password, data) {
  let key;
  return Aes.pbkdf2('password', 'salt', 5000, 256).then(aes => {
    key = aes;
    return Aes.randomKey(16).then(iv => {
      return Aes.encrypt(data, key, iv).then(cipher => {
        return {
          cipher,
          iv,
        };
      });
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

export default {read, write, readMulti, remove, clear, encrypt, decrypt};
