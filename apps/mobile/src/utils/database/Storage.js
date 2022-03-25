import { Platform } from 'react-native';
import 'react-native-get-random-values';
import RNFetchBlob from 'rn-fetch-blob';
import {
  decrypt,
  deriveCryptoKey,
  encrypt,
  generateCryptoKey,
  getCryptoKey,
  getRandomBytes,
  hash,
  removeCryptoKey
} from './encryption';
import { MMKV } from './mmkv';

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
  return await MMKV.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
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

async function getAllKeys() {
  return await MMKV.indexer.getKeys();
}

async function requestPermission() {
  if (Platform.OS === 'ios') return true;
  return true;
}
async function checkAndCreateDir(path) {
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
