import {Platform} from 'react-native';
import 'react-native-get-random-values';
import * as Keychain from 'react-native-keychain';
import {generateSecureRandom} from 'react-native-securerandom';
import Sodium from 'react-native-sodium';
import {MMKV} from './mmkv';

let RNFetchBlob;
async function read(key) {
  if (!key) return null;
  let data = await MMKV.getItem(key);

  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

async function write(key, data) {
  return await MMKV.setItem(
    key,
    typeof data === 'string' ? data : JSON.stringify(data)
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

async function encrypt(password, data) {
  if (!password.password && !password.key) return undefined;
  if (password.password && password.password === '' && !password.key)
    return undefined;

  let message = {
    type: 'plain',
    data: data
  };
  let result = await Sodium.encrypt(password, message);

  return {
    ...result,
    alg: getAlgorithm(7)
  };
}

function getAlgorithm(base64Variant) {
  return `xcha-argon2i13-${base64Variant}`;
}

async function decrypt(password, data) {
  if (!password.password && !password.key) return undefined;
  if (password.password && password.password === '' && !password.key)
    return undefined;
  let _data = {...data};
  _data.output = 'plain';
  return await Sodium.decrypt(password, _data);
}

function parseAlgorithm(alg) {
  if (!alg) return {};
  const [enc, kdf, compressed, compressionAlg, base64variant] = alg.split('-');
  return {
    encryptionAlgorithm: enc,
    kdfAlgorithm: kdf,
    compressionAlgorithm: compressionAlg,
    isCompress: compressed === '1',
    base64_variant: base64variant
  };
}

let CRYPT_CONFIG = Platform.select({
  ios: {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  },
  android: {}
});

async function deriveCryptoKey(name, data) {
  try {
    let credentials = await Sodium.deriveKey(data.password, data.salt);
    await Keychain.setInternetCredentials(
      'notesnook',
      name,
      credentials.key,
      CRYPT_CONFIG
    );
    return credentials.key;
  } catch (e) {}
}

async function getCryptoKey(name) {
  try {
    if (await Keychain.hasInternetCredentials('notesnook')) {
      let credentials = await Keychain.getInternetCredentials(
        'notesnook',
        CRYPT_CONFIG
      );
      return credentials.password;
    } else {
      return null;
    }
  } catch (e) {}
}

async function removeCryptoKey(name) {
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
  if (Platform.OS === 'ios') return true;

  return true;
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
  let result = await Sodium.hashPassword(password, email);
  return result;
}

async function generateCryptoKey(password, salt) {
  try {
    let credentials = await Sodium.deriveKey(password, salt || null);
    return credentials;
  } catch (e) {
    console.log('generateCryptoKey: ', e);
  }
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
  generateCryptoKey
};
