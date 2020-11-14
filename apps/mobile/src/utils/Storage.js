import "react-native-get-random-values";
import {generateSecureRandom} from 'react-native-securerandom';
import Sodium from 'react-native-sodium';
import RNFetchBlob from 'rn-fetch-blob';
import {PERMISSIONS, requestMultiple, RESULTS} from "react-native-permissions";
import {MMKV} from "./MMKV";
import { Platform } from "react-native";
import { ANDROID_PATH, IOS_PATH } from ".";

async function read(key, isArray = false) {
  let data = await MMKV.getItem(key);
  if (!data) return null;
  try {
    data = JSON.parse(data);
    //data = Array.isArray(data) ? [...data] : data;
  } catch (e) {
    
  }

  return data;
}


async function write(key, data) {
  return await MMKV.setItem(
    key,
    typeof data === 'string' ? data : JSON.stringify(data),
  );

}

async function readMulti(keys) {
  if (keys.length <= 0) {
    return [];
  } else {
    let data = await MMKV.getMultipleItemsAsync(keys.slice());

    return data.map(([key, value]) => {
      let obj;
      try {
        obj = JSON.parse(value);
      } catch (e) {
        obj = value;
      }

      return [key, obj];
    });
  }
}

async function remove(key) {
  return await MMKV.removeItem(key);
}

async function clear() {
  return await MMKV.clearStore();
}

function encrypt(password, data) {
  return Sodium.encrypt(password, data).then((result) => result);
}

function decrypt(password, data) {
  return Sodium.decrypt(password, data).then((result) => result);
}

async function deriveKey(password, salt) {
  try {
    let data = await Sodium.deriveKey(password, salt);

    return data.key;
  } catch (e) {}
}



async function getAllKeys() {
  return await MMKV.indexer.getKeys();
}

async function getRandomBytes(length) {
  return await generateSecureRandom(length);
}

async function requestPermission() {
  let granted = false;
  try {
    const response = await requestMultiple([
      PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    ]);
    granted =
        response['android.permission.READ_EXTERNAL_STORAGE'] ===
        RESULTS.GRANTED &&
        response['android.permission.WRITE_EXTERNAL_STORAGE'] === RESULTS.GRANTED;
  } catch (err) {
  }
  return granted;
}
async function checkAndCreateDir(path) {
  let dir = Platform.OS === "ios"? IOS_PATH + path : ANDROID_PATH + path;
  try {
    let exists = await RNFetchBlob.fs.exists(dir);
    let isDir = await RNFetchBlob.fs.isDir(dir);
    if (!exists || !isDir) {
      await RNFetchBlob.fs.mkdir(dir);
    }
  } catch (e) {
    console.log(e);
    await RNFetchBlob.fs.mkdir(dir);
  } finally {
  }
  return dir;
}

export default {
  read,
  write,
  readMulti,
  remove,
  clear,
  encrypt,
  decrypt,
  deriveKey,
  getAllKeys,
  getRandomBytes,
  checkAndCreateDir,
  requestPermission
};
