import React from 'react';
import Sodium from 'react-native-sodium';
import RNFetchBlob from 'rn-fetch-blob';
import {useAttachmentStore} from '../provider/stores';
import {eSendEvent, ToastEvent} from '../services/EventManager';
import {db} from './database';
import Storage from './storage';
import * as ScopedStorage from 'react-native-scoped-storage';
import {eOpenProgressDialog} from './Events';
import {ShareComponent} from '../components/ExportDialog/share';
import {Platform} from 'react-native';

const cacheDir = RNFetchBlob.fs.dirs.CacheDir;

async function readEncrypted(filename, key, cipherData) {
  try {
    let path = `${cacheDir}/${filename}`;
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

async function writeEncrypted(filename, {data, type, key}) {
  console.log('file input: ', {type, key});
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

async function uploadFile(filename, {url, headers}, cancelToken) {
  console.log('uploading file: ', filename, headers);

  try {
    let res = await fetch(url, {
      method: 'PUT',
      headers
    });
    const uploadUrl = await res.text();
    console.log(uploadUrl);
    console.log(uploadUrl);
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
        useAttachmentStore
          .getState()
          .setProgress(sent, total, filename, 0, 'upload');
        console.log('uploading: ', sent, total);
      });
    cancelToken.cancel = request.cancel;
    let response = await request;
    console.log(response.info().status);
    let status = response.info().status;
    let result = status >= 200 && status < 300;
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

async function downloadFile(filename, {url, headers}, cancelToken) {
  console.log('downloading file: ', filename, url);
  try {
    let path = `${cacheDir}/${filename}`;
    let exists = await RNFetchBlob.fs.exists(path);
    if (exists) {
      console.log("file is downloaded");
      return true;
    }
    console.log('downloading again')
    let res = await fetch(url, {
      method: 'GET',
      headers
    });
    const downloadUrl = await res.text();
    console.log(downloadUrl);
    let request = RNFetchBlob.config({
      path: path,
      IOSBackgroundTask: true
    })
      .fetch('GET', downloadUrl, null)
      .progress((recieved, total) => {
        useAttachmentStore
          .getState()
          .setProgress(0, total, filename, recieved, 'download');
        console.log('downloading: ', recieved, total);
      });
    cancelToken.cancel = request.cancel;
    let response = await request;
    let status = response.info().status;
    useAttachmentStore.getState().remove(filename);
    return status >= 200 && status < 300;
  } catch (e) {
    useAttachmentStore.getState().remove(filename);
    console.log('download file error: ', e, url, headers);
    return false;
  }
}

async function deleteFile(filename, data) {
  let {url, headers} = data;
  console.log('deleting file', data);
  if (!data) {
    if (!filename) return;
    let delFilePath = cacheDir + `/${filename}`;
    RNFetchBlob.fs.unlink(delFilePath).catch(console.log);
    return true;
  }
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
  return (filename, {url, headers}) => {
    return {
      execute: () => operation(filename, {url, headers}, cancelToken),
      cancel: async () => {
        await cancelToken.cancel();
        RNFetchBlob.fs.unlink(`${cacheDir}/${filename}`).catch(console.log)
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
    folder = await ScopedStorage.openDocumentTree(false);
    if (!folder) return;
  } else {
    folder.uri = await Storage.checkAndCreateDir('/downloads/');
  }

  try {
    await db.fs.downloadFile(
      attachment.metadata.hash,
      attachment.metadata.hash
    );
    if (
      !(await RNFetchBlob.fs.exists(`${cacheDir}/${attachment.metadata.hash}`))
    )
      return;
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
    RNFetchBlob.fs.unlink(
      RNFetchBlob.fs.dirs.CacheDir + `/${attachment.metadata.hash}`
    ).catch(console.log);

    if (Platform.OS === 'ios') {
      fileUri = folder.uri + `/${attachment.metadata.filename}`;
    }
    console.log('saved file uri: ', fileUri);

    eSendEvent(eOpenProgressDialog, {
      title: `File downloaded`,
      paragraph: `${attachment.metadata.filename} is saved to ${
        Platform.OS === 'android'
          ? 'the selected path'
          : 'File Manager/Notesnook/downloads'
      }`,
      noProgress: true,
      icon: 'download',
      context: global ? null : attachment.metadata.hash,
      component: (
        <ShareComponent
          uri={fileUri}
          name={attachment.metadata.filename}
          padding={12}
        />
      )
    });
    return fileUri;
  } catch (e) {
    console.log('download attachment error: ', e);
    useAttachmentStore.getState().remove(attachment.metadata.hash);
  }
}

export default {
  readEncrypted,
  writeEncrypted,
  uploadFile: cancelable(uploadFile),
  downloadFile: cancelable(downloadFile),
  deleteFile,
  exists,
  downloadAttachment
};
