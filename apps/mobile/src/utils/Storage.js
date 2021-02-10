import {Platform} from 'react-native';
import 'react-native-get-random-values';
import {PERMISSIONS, requestMultiple, RESULTS} from 'react-native-permissions';
import {generateSecureRandom} from 'react-native-securerandom';
import {MMKV} from './mmkv';

let Sodium;
let Keychain;
let RNFetchBlob;
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
  if (!Sodium) {
    Sodium = require('react-native-sodium');
  }

  return Sodium.encrypt(password, data).then((result) => result);
}

function decrypt(password, data) {
  if (!Sodium) {
    Sodium = require('react-native-sodium')
  }
  return Sodium.decrypt(password, data).then((result) => result);
}

let CRYPT_CONFIG = (kc) =>
  Platform.select({
    ios: {
      accessible: kc.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    },
    android: {
      authenticationType: kc.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
      accessControl: kc.ACCESS_CONTROL.DEVICE_PASSCODE,
      rules: kc.SECURITY_RULES.AUTOMATIC_UPGRADE,
      authenticationPrompt: {
        cancel: null,
      },
    },
  });

async function deriveCryptoKey(name, data) {
  if (!Keychain) {
    Keychain = require('react-native-keychain');
  }

  if (!Sodium) {
    Sodium = require('react-native-sodium');
  }

  try {
    let credentials = await Sodium.deriveKey(data.password, data.salt);
    await Keychain.setInternetCredentials(
      'notesnook',
      name,
      credentials.key,
      CRYPT_CONFIG(Keychain),
    );
    return credentials.key;
  } catch (e) {}
}

async function getCryptoKey(name) {
  if (!Keychain) {
    Keychain = require('react-native-keychain');
  }
  try {
    if (await Keychain.hasInternetCredentials('notesnook')) {
      let credentials = await Keychain.getInternetCredentials(
        'notesnook',
        CRYPT_CONFIG,
      );
      return credentials.password;
    } else {
      return null;
    }
  } catch (e) {}
}

async function removeCryptoKey(name) {
  if (!Keychain) {
    Keychain = require('react-native-keychain');
  }

  try {
    let result = await Keychain.resetInternetCredentials('notesnook');
    return result;
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
  } catch (err) {}
  return granted;
}
async function checkAndCreateDir(path) {
  if (!RNFetchBlob) {
    RNFetchBlob = require('rn-fetch-blob');
  }

  let dir =
    Platform.OS === 'ios'
      ? RNFetchBlob.fs.dirs.DocumentDir + path
      : RNFetchBlob.fs.dirs.SDCardDir + '/Notesnook/' + path;

  try {
    let exists = await RNFetchBlob.fs.exists(dir);
    let isDir = await RNFetchBlob.fs.isDir(dir);
    if (!exists || !isDir) {
      await RNFetchBlob.fs.mkdir(dir);
    }
  } catch (e) {
    await RNFetchBlob.fs.mkdir(dir);
  } finally {
  }
  return dir;
}

async function hash(password, email) {
  if (!Sodium) {
    Sodium = require('react-native-sodium');
  }
  return await Sodium.hashPassword(password, email);
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
  hash,
};
