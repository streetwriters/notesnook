import {NativeModules} from 'react-native';
import FastStorage, {getArray, setArray} from 'react-native-fast-storage';

var Aes = NativeModules.Aes;

async function read(key, isArray = false) {
  let data;
  if (isArray) {
    data = await getArray(key);
  } else {
    data = await FastStorage.getMap(key);
  }

  return data;
}

async function write(key, data) {
  if (data.length !== undefined) {
    return await setArray(key, data);
  } else {
    return await FastStorage.setMap(key, data);
  }
}

async function readMulti(keys) {
  if (keys.length <= 0) {
    return [];
  } else {
    let data = await FastStorage.getMultipleItems(keys.slice());
    return !data ? undefined : data;
  }
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
