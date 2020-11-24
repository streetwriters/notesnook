import {NativeModules, Platform} from 'react-native';
const {ReceiveSharingIntent} = NativeModules;
let currentIntent = null;
const isIos = Platform.OS === 'ios';

function getIntent() {
  return new Promise(async (resolve, reject) => {
    let initialUrlIOS;
    let _data = null;
    try {
      if (isIos) {
        initialUrlIOS = await Linking.getInitialURL();
        if (res && res.startsWith('ShareMedia://dataUrl')) {
          _data = await ReceiveSharingIntent.getFileNames(initialUrlIOS.url);
        } else {
          reject('unsupported url');
        }
      } else {
        _data = await ReceiveSharingIntent.getFileNames();
      }
    } catch (e) {
      reject(e);
    }
    if (!_data) {
      console.log(_data);
      return;
    }
    setIntent(_data, resolve, reject);
  });
}

function setIntent(d, resolve, reject) {
  let data = d[0];
  if (data.text || data.weblink) {
    let text = data.text;
    let weblink = data.weblink;
    let delta = null;

    if (weblink && text) {
      delta = [{insert: `${text + ' ' + weblink}`}];
      text = data.text + ' ' + data.weblink;
    } else if (text && !weblink) {
      delta = [{insert: `${text}`}];
      text = data.text;
    } else if (weblink) {
      delta = [{insert: `${weblink}`}];
      text = weblink;
    }
    currentIntent = {
      type: 'intent',
      data: delta,
    };
    if (resolve) {
      resolve(true);
    }
  } else {
    if (reject) {
      reject('nothing found');
    }
  }
}

function check(callback) {
  callback(currentIntent);
  currentIntent = null;
}

export default {
  getIntent,
  check,
  setIntent,
};
