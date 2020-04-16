import MMKV from 'react-native-mmkv-storage';
import Sodium from "react-native-sodium";

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
  if (Array.isArray(data)) {
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

async function remove(key) {
  return await MMKV.removeItem(key);
}

async function clear() {
  return await MMKV.clearStore();
}

function encrypt(password, data) {

  return Sodium.encrypt(password, data).then(result => result);
}

function decrypt(password, data) {

  return Sodium.decrypt(password, data).then(result => result);

}

async function deriveKey(password, salt) {

  try {

    let data = await Sodium.deriveKey(password, salt)

    return data.key
  } catch (e) {

  }

}


export default { read, write, readMulti, remove, clear, encrypt, decrypt, deriveKey };
