import { NativeModules } from 'react-native';
import MMKV from 'react-native-mmkv-storage';
import Sodium from "react-native-sodium";
import { func } from 'prop-types';

var Aes = NativeModules.Aes;

async function read(key, isArray = false) {
  let data;
  if (isArray) {
    try {
      data = await MMKV.getArrayAsync(key);
    } catch (e) {
      data = [];
    }
  } else if (key === "hasConflicts") {
    return await MMKV.getBoolAsync(key);
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
  } else if (typeof data === 'boolean') {
    return await MMKV.setBoolAsync(key, data);
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

  return Sodium.encrypt({ password: password }, data).then(result => result);
}

function decrypt(password, data) {
  return Sodium.decrypt({ password: password }, data).then(result => result);
}

function deriveKey(passoword) {
  return Sodium.deriveKey('password').then(result => result);
}


export default { read, write, readMulti, remove, clear, encrypt, decrypt, deriveKey };
