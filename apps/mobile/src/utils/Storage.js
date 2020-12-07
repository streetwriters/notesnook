import 'react-native-get-random-values';
import {generateSecureRandom} from 'react-native-securerandom';
import Sodium from 'react-native-sodium';
import RNFetchBlob from 'rn-fetch-blob';
import {PERMISSIONS, requestMultiple, RESULTS} from 'react-native-permissions';
import {MMKV} from './mmkv';
import {Platform} from 'react-native';
import {ANDROID_PATH, IOS_PATH} from '.';
import * as Keychain from 'react-native-keychain';

async function read(key, isArray = false) {
  let data = await MMKV.getItem(key);
  if (!data) return null;
  try {
    data = JSON.parse(data);
  } catch (e) {}

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

let CRYPT_CONFIG = Platform.select({
  ios:{
    accessible:Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK
  },
  android:{
    authenticationType:
    Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
  accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
  rules: Keychain.SECURITY_RULES.AUTOMATIC_UPGRADE,
  }
})

async function deriveCryptoKey(name, data) {
  try {
    let credentials = await Sodium.deriveKey(data.password, data.salt);
    await Keychain.setInternetCredentials('notesnook', name, credentials.key, CRYPT_CONFIG);

    return credentials.key;
  } catch (e) {
    console.log(e);
  }
}

async function getCryptoKey(name) {
  try {
    if (await Keychain.hasInternetCredentials('notesnook')) {
      let credentials = await Keychain.getInternetCredentials('notesnook', CRYPT_CONFIG);
      return credentials.password;
    } else {
      return null;
    }
  } catch (e) {
    console.log(e);
  }
}

async function removeCryptoKey(name) {
  try {
    let result = await Keychain.resetInternetCredentials('notesnook');
    return result;
  } catch (e) {
    console.log(e);
  }
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
  } catch (err) {}
  return granted;
}
async function checkAndCreateDir(path) {
  let dir = Platform.OS === 'ios' ? IOS_PATH + path : ANDROID_PATH + path;
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
  getAllKeys,
  getRandomBytes,
  checkAndCreateDir,
  requestPermission,
  deriveCryptoKey,
  getCryptoKey,
  removeCryptoKey,
};
