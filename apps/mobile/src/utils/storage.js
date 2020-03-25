import {NativeModules} from 'react-native';
import MMKV from 'react-native-mmkv-storage';

var Aes = NativeModules.Aes;

async function read(key, isArray = false) {
  let data;
  if (isArray) {
    try {
      data = await MMKV.getArrayAsync(key);
    } catch (e) {
      data = [];
    }
  } else {
    try {
      data = await MMKV.getMapAsync(key);
    } catch (e) {
      data = null;
    }
  }

  return isArray ? data.slice() : data;
}

async function write(key, data) {
  if (data.length !== undefined) {
    return await MMKV.setArrayAsync(key, data.slice());
  } else {
    return await MMKV.setMapAsync(key, data);
  }
}

async function readMulti(keys) {
  if (keys.length <= 0) {
    return [];
  } else {
    let data = await MMKV.getMultipleItemsAsync(keys.slice());

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
  return Aes.pbkdf2(password, 'salt', 5000, 256).then(aes => {
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
