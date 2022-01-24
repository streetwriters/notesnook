/* import {Linking, NativeModules, Platform} from 'react-native';
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
        if (initialUrlIOS && initialUrlIOS.startsWith('ShareMedia://dataUrl')) {
          _data = await ReceiveSharingIntent.getFileNames(initialUrlIOS);
          _data = iosSortedData(_data);
        } else {
          reject('unsupported url');
        }
      } else {
        _data = await ReceiveSharingIntent.getFileNames();
      }
    } catch (e) {
      reject(e);
    }
    ReceiveSharingIntent.clearFileNames();
    if (!_data) {
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
      delta = [{insert: text}, {insert: weblink, attributes: {link: weblink}}];
    } else if (text && !weblink) {
      delta = [{insert: text}];
    } else if (weblink) {
      delta = [{insert: weblink, attributes: {link: weblink}}];
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

const iosSortedData = (data) => {
  let objects = {
    filePath: null,
    text: null,
    weblink: null,
    mimeType: null,
    contentUri: null,
    fileName: null,
    extension: null,
  };
  let file = data;
  if (file.startsWith('text:')) {
    let text = file.replace('text:', '');
    if (text.startsWith('http')) {
      let object = [{...objects, weblink: text}];
      return object;
    }
    let object = [{...objects, text: text}];
    return object;
  } else if (file.startsWith('webUrl:')) {
    let weblink = file.replace('webUrl:', '');
    let object = [{...objects, weblink: weblink}];
    return object;
  } else {
    try {
      let files = JSON.parse(file);
      let object = [];
      for (let i = 0; i < files.length; i++) {
        let path = files[i].path;
        let obj = {
          ...objects,
          fileName: getFileName(path),
          extension: getExtension(path),
          mimeType: getMimeType(path),
          filePath: path,
        };
        object.push(obj);
      }
      return object;
    } catch (error) {
      return [{...objects}];
    }
  }
};

const getFileName = (file) => {
  return file.replace(/^.*(\\|\/|\:)/, '');
};

const getExtension = (fileName) => {
  return fileName.substr(fileName.lastIndexOf('.') + 1);
};

const getMimeType = (file) => {
  let ext = getExtension(file);
  let extension = '.' + ext.toLowerCase();
  if (MimeTypes[extension]) {
    return MimeTypes[extension];
  }
  return null;
};

export default {
  getIntent,
  check,
  setIntent,
  iosSortedData,
};
 */
