import AsyncStorage from '@react-native-community/async-storage';

async function read(key) {
  return await AsyncStorage.getItem(key);
}

async function write(key, data) {
  return await AsyncStorage.setItem(key, data);
}

function remove(key) {
  AsyncStorage.removeItem(key);
}

function clear() {
  AsyncStorage.clear();
}

export default {read, write, remove, clear};
