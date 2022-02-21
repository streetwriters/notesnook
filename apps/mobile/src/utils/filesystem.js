import React from 'react';
import { Platform } from 'react-native';
import * as ScopedStorage from 'react-native-scoped-storage';
import Sodium from 'react-native-sodium';
import RNFetchBlob from 'rn-fetch-blob';
import { ShareComponent } from '../components/ExportDialog/share';
import { useAttachmentStore } from '../provider/stores';
import { presentSheet, ToastEvent } from '../services/EventManager';
import { db } from './database';
import Storage from './storage';

const cacheDir = RNFetchBlob.fs.dirs.CacheDir;

async function readEncrypted(filename, key, cipherData) {
  let path = `${cacheDir}/${filename}`;
  try {
    let exists = await RNFetchBlob.fs.exists(path);
    if (!exists) {
      return false;
    }

    let output = await Sodium.decryptFile(
      key,
      {
        ...cipherData,
        hash: filename
      },
      true
    );
    console.log('output length: ', output?.length);
    return output;
  } catch (e) {
    RNFetchBlob.fs.unlink(path).catch(console.log);
    console.log(e);
    console.log('error');
    return false;
  }
}

function randId(prefix) {
  return Math.random()
    .toString(36)
    .replace('0.', prefix || '');
}

async function writeEncrypted(filename, { data, type, key }) {
  console.log('file input: ', { type, key });
  let filepath = cacheDir + `/${randId('imagecache_')}`;
  console.log(filepath);
  await RNFetchBlob.fs.writeFile(filepath, data, 'base64');
  let output = await Sodium.encryptFile(key, {
    uri: Platform.OS === 'ios' ? filepath : `file://` + filepath,
    type: 'url'
  });
  RNFetchBlob.fs.unlink(filepath).catch(console.log);

  console.log('encrypted file output: ', output);
  return {
    ...output,
    alg: `xcha-stream`
  };
}

async function uploadFile(filename, data, cancelToken) {
  if (!data) return false;
  let { url, headers } = data;

  console.log('uploading file: ', filename, headers);
  try {
    let res = await fetch(url, {
      method: 'PUT',
      headers
    });
    if (!res.ok) throw new Error(`${res.status}: Unable to resolve upload url`);
    const uploadUrl = await res.text();
    if (!uploadUrl) throw new Error('Unable to resolve upload url');

    let request = RNFetchBlob.config({
      IOSBackgroundTask: true
    })
      .fetch(
        'PUT',
        uploadUrl,
        {
          'content-type': ''
        },
        RNFetchBlob.wrap(`${cacheDir}/${filename}`)
      )
      .uploadProgress((sent, total) => {
        useAttachmentStore.getState().setProgress(sent, total, filename, 0, 'upload');
        console.log('uploading: ', sent, total);
      });
    cancelToken.cancel = request.cancel;
    let response = await request;

    let status = response.info().status;
    let text = await response.text();
    let result = status >= 200 && status < 300 && text.length === 0;
    useAttachmentStore.getState().remove(filename);
    if (result) {
      let attachment = db.attachments.attachment(filename);
      if (!attachment) return result;
      if (!attachment.metadata.type.startsWith('image/')) {
        RNFetchBlob.fs.unlink(`${cacheDir}/${filename}`).catch(console.log);
      }
    }

    return result;
  } catch (e) {
    useAttachmentStore.getState().remove(filename);
    console.log('upload file: ', e, url, headers);
    return false;
  }
}

function valueFromXml(code, xml) {
  if (!xml.includes(code)) return `Unknown ${code}`;
  return xml.slice(xml.indexOf(`<${code}>`) + code.length + 2, xml.indexOf(`</${code}>`));
}

async function fileCheck(response, totalSize) {
  if (totalSize < 1000) {
    let text = await response.text();
    console.log(text);
    if (text.startsWith('<?xml')) {
      let errorJson = {
        Code: valueFromXml('Code', text),
        Message: valueFromXml('Message', text)
      };
      throw new Error(`${errorJson.Code}: ${errorJson.Message}`);
    }
  }
}

async function downloadFile(filename, data, cancelToken) {
  if (!data) return false;
  let { url, headers } = data;

  console.log('downloading file: ', filename, url);
  let path = `${cacheDir}/${filename}`;
  try {
    let exists = await RNFetchBlob.fs.exists(path);
    if (exists) {
      console.log(await RNFetchBlob.fs.readFile(path, 'utf8'));
      console.log('file is downloaded');
      return true;
    }

    let res = await fetch(url, {
      method: 'GET',
      headers
    });
    if (!res.ok) throw new Error(`${res.status}: Unable to resolve download url`);
    const downloadUrl = await res.text();

    if (!downloadUrl) throw new Error('Unable to resolve download url');
    let totalSize = 0;
    let request = RNFetchBlob.config({
      path: path,
      IOSBackgroundTask: true
    })
      .fetch('GET', downloadUrl, null)
      .progress((recieved, total) => {
        useAttachmentStore.getState().setProgress(0, total, filename, recieved, 'download');
        totalSize = total;
        console.log('downloading: ', recieved, total);
      });

    cancelToken.cancel = request.cancel;
    let response = await request;
    await fileCheck(response, totalSize);
    let status = response.info().status;
    useAttachmentStore.getState().remove(filename);
    return status >= 200 && status < 300;
  } catch (e) {
    ToastEvent.show({
      heading: 'Error downloading file',
      message: e.message,
      type: 'error'
    });

    useAttachmentStore.getState().remove(filename);
    RNFetchBlob.fs.unlink(path).catch(console.log);
    console.log('download file error: ', e, url, headers);
    return false;
  }
}

async function deleteFile(filename, data) {
  if (!data) {
    if (!filename) return;
    let delFilePath = cacheDir + `/${filename}`;
    RNFetchBlob.fs.unlink(delFilePath).catch(console.log);
    return true;
  }

  let { url, headers } = data;
  try {
    let response = await RNFetchBlob.fetch('DELETE', url, headers);
    let status = response.info().status;
    return status >= 200 && status < 300;
  } catch (e) {
    console.log('delete file: ', e, url, headers);
    return false;
  }
}

async function exists(filename) {
  let exists = await RNFetchBlob.fs.exists(`${cacheDir}/${filename}`);
  return exists;
}

function cancelable(operation) {
  const cancelToken = {
    cancel: () => {}
  };
  return (filename, { url, headers }) => {
    return {
      execute: () => operation(filename, { url, headers }, cancelToken),
      cancel: async () => {
        await cancelToken.cancel();
        RNFetchBlob.fs.unlink(`${cacheDir}/${filename}`).catch(console.log);
      }
    };
  };
}

async function downloadAttachment(hash, global = true) {
  let attachment = db.attachments.attachment(hash);
  if (!attachment) {
    console.log('attachment not found');
    return;
  }

  let folder = {};
  if (Platform.OS === 'android') {
    folder = await ScopedStorage.openDocumentTree();
    if (!folder) return;
  } else {
    folder.uri = await Storage.checkAndCreateDir('/downloads/');
  }

  try {
    await db.fs.downloadFile(attachment.metadata.hash, attachment.metadata.hash);
    if (!(await RNFetchBlob.fs.exists(`${cacheDir}/${attachment.metadata.hash}`))) return;

    let key = await db.attachments.decryptKey(attachment.key);
    console.log('attachment key', key);
    let info = {
      iv: attachment.iv,
      salt: attachment.salt,
      length: attachment.length,
      alg: attachment.alg,
      hash: attachment.metadata.hash,
      hashType: attachment.metadata.hashType,
      mime: attachment.metadata.type,
      fileName: attachment.metadata.filename,
      uri: folder.uri,
      chunkSize: attachment.chunkSize
    };

    let fileUri = await Sodium.decryptFile(key, info, false);
    ToastEvent.show({
      heading: 'Download successful',
      message: attachment.metadata.filename + ' downloaded',
      type: 'success'
    });

    if (attachment.dateUploaded) {
      console.log('Deleting attachment after download', attachment.dateUploaded);
      RNFetchBlob.fs
        .unlink(RNFetchBlob.fs.dirs.CacheDir + `/${attachment.metadata.hash}`)
        .catch(console.log);
    }

    if (Platform.OS === 'ios') {
      fileUri = folder.uri + `/${attachment.metadata.filename}`;
    }
    console.log('saved file uri: ', fileUri);

    presentSheet({
      title: `File downloaded`,
      paragraph: `${attachment.metadata.filename} saved to ${
        Platform.OS === 'android' ? 'selected path' : 'File Manager/Notesnook/downloads'
      }`,
      icon: 'download',
      context: global ? null : attachment.metadata.hash,
      component: <ShareComponent uri={fileUri} name={attachment.metadata.filename} padding={12} />
    });
    return fileUri;
  } catch (e) {
    console.log('download attachment error: ', e);
    if (attachment.dateUploaded) {
      console.log('Deleting attachment on error', attachment.dateUploaded);
      RNFetchBlob.fs
        .unlink(RNFetchBlob.fs.dirs.CacheDir + `/${attachment.metadata.hash}`)
        .catch(console.log);
    }
    useAttachmentStore.getState().remove(attachment.metadata.hash);
  }
}

async function clearFileStorage() {
  try {
    let files = await RNFetchBlob.fs.ls(cacheDir);
    for (let file of files) {
      try {
        await RNFetchBlob.fs.unlink(cacheDir + `/${file}`);
      } catch (e) {
        console.log(e);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

export default {
  readEncrypted,
  writeEncrypted,
  uploadFile: cancelable(uploadFile),
  downloadFile: cancelable(downloadFile),
  deleteFile,
  exists,
  downloadAttachment,
  clearFileStorage
};
