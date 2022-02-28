import React from 'react';
import { Platform } from 'react-native';
import * as ScopedStorage from 'react-native-scoped-storage';
import Sodium from 'react-native-sodium';
import RNFetchBlob from 'rn-fetch-blob';
import { ShareComponent } from '../../components/sheets/export-notes/share';
import { useAttachmentStore } from '../../stores/stores';
import { presentSheet, ToastEvent } from '../../services/event-manager';
import { db } from '../database';
import Storage from '../database/storage';
import { cacheDir, fileCheck } from './utils';

export async function downloadFile(filename, data, cancelToken) {
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

export async function downloadAttachment(hash, global = true) {
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
