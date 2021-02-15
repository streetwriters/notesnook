import {Platform} from 'react-native';
import 'react-native-get-random-values';
import {PERMISSIONS, requestMultiple, RESULTS} from 'react-native-permissions';
import {generateSecureRandom} from 'react-native-securerandom';
import {MMKV} from './mmkv';
import Sodium from 'react-native-sodium';

let Keychain;
let RNFetchBlob;
async function read(key, isArray = false) {
  //let per = performance.now();
  let data = await MMKV.getItem(key);
  //console.log("[INIT S1]",key + "_key", performance.now() - per);
  if (!data) return null;
  data = JSON.parse(data);
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

async function encrypt(password, data, _compress) {
  let message = {
    type: _compress ? 'b64' : 'plain',
    data: _compress ? compress(data) : data,
  };
  console.log(message);
  let result = await Sodium.encrypt(password, message);

  return {
    ...result,
    alg: getAlgorithm(7, _compress ? 1 : 0),
  };
}

function getAlgorithm(base64Variant, _compress) {
  return `xcha-argon2i13-${_compress}-${base64Variant}`;
}

async function decrypt(password, data) {
  let algorithm = parseAlgorithm(data.alg);
  console.log(algorithm);
  data.output = algorithm.isCompress ? 'b64' : 'plain';

  let result = await Sodium.decrypt(password, data);
  console.log('result-decrypt',result)
  if (algorithm.isCompress) {
    return decompress(result);
  }
  return result;
}

function parseAlgorithm(alg) {
  if (!alg) return {};
  const [enc, kdf, compressed, base64variant] = alg.split('-');
  return {
    encryptionAlgorithm: enc,
    kdfAlgorithm: kdf,
    isCompress: compressed === "1",
    base64_variant: base64variant,
  };
}

let CRYPT_CONFIG = (kc) =>
  Platform.select({
    ios: {
      accessible: kc.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    },
    android: {
      authenticationType: kc.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
      accessControl: kc.ACCESS_CONTROL.DEVICE_PASSCODE,
      rules: 'none',
      authenticationPrompt: {
        cancel: null,
      },
      storage: kc.STORAGE_TYPE.AES,
    },
  });

async function deriveCryptoKey(name, data) {
  if (!Keychain) {
    Keychain = require('react-native-keychain');
  }

  try {
    let credentials = await Sodium.deriveKey(data.password, data.salt);
    await Keychain.setInternetCredentials(
      'notesnook',
      name,
      credentials.key,
      {},
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
    RNFetchBlob = require('rn-fetch-blob').default;
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
  return await Sodium.hashPassword(password, email);
}

let lzutf8;

function compress(data) {
  if (!lzutf8) {
    lzutf8 = require('lzutf8');
  }
  return lzutf8.compress(data, {
    blockSize: 64 * 64 * 1024,
    outputEncoding: 'Base64',
    inputEncoding: 'String',
  });
}

function decompress(data) {
  if (!lzutf8) {
    lzutf8 = require('lzutf8');
  }
  return lzutf8.decompress(data, {
    blockSize: 64 * 64 * 1024,
    inputEncoding: 'Base64',
    outputEncoding: 'String',
  });
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
