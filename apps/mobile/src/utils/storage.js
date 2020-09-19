import 'react-native-get-random-values';
import { isArray } from 'lodash';
import { Platform } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import MMKVStorage from 'react-native-mmkv-storage';
import { generateSecureRandom } from 'react-native-securerandom';
import Sodium from 'react-native-sodium';
import RNFetchBlob from 'rn-fetch-blob';
export const MMKV = new MMKVStorage.Loader().initialize();

async function read(key, isArray = false) {
  let data;

  try {
    data = await MMKV.getItem(key);
  } catch (e) {}
  if (!data) return null;
  try {
    data = JSON.parse(data);
    
    data = isArray? [...data] : data;
  } catch (e) {
    data = data;
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

    let map = data.map(([key, value]) => {
      let obj;
      try {
        obj = JSON.parse(value);
    
      } catch (e) {
        obj = value;
      }
      
      return [key, obj];
    })
  
    return map;

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

async function saveToPDF(html, filename) {
  let options = {
    html: html,
    fileName: filename,
    directory:
      Platform.OS === 'ios'
        ? 'Documents'
        : RNFetchBlob.fs.dirs.SDCardDir + '/Call Of Writing/exported/PDF/',
  };

  return await RNHTMLtoPDF.convert(options);
}

async function getAllKeys() {
  return await MMKV.indexer.getKeys();
}

async function getRandomBytes(length) {
  return await generateSecureRandom(length);
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
  saveToPDF,
  getAllKeys,
  getRandomBytes,
};
