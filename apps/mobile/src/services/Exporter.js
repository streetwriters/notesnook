import {Platform} from 'react-native';
import {db} from '../utils/DB';
import {ToastEvent} from './EventManager';
import RNHTMLtoPDF from 'react-native-html-to-pdf-lite';
import Storage from '../utils/storage';
import showdown from 'showdown';
import jsdom from 'jsdom-jscore-rn';
import { sanitizeFilename } from '../utils/filename';

let RNFetchBlob;

async function saveToPDF(note) {
  let androidSavePath = '/Notesnook/exported/PDF';
  if (Platform.OS === 'android') {
    let hasPermission = await Storage.requestPermission();
    if (!hasPermission) {
      ToastEvent.show({
        heading: 'Cannot export',
        message: 'You must provide phone storage access to backup data.',
        type: 'error',
        context: 'local',
      });
      return null;
    }
  }

  await Storage.checkAndCreateDir('/exported/PDF/');
  let html = await db.notes.note(note).export('html');
  let he = require('he');
  html = he.decode(html);
  let fileName = sanitizeFilename(note.title, {replacement: '_'});
  let options = {
    html: html,
    fileName: Platform.OS === 'ios' ? '/exported/PDF/' + fileName : fileName,
    directory: Platform.OS === 'ios' ? 'Documents' : androidSavePath,
  };
  let res = await RNHTMLtoPDF.convert(options);

  return {
    filePath: res.filePath,
    type: 'application/pdf',
    name: 'PDF',
  };
}

async function saveToMarkdown(note) {
  let path = await Storage.checkAndCreateDir('/exported/Markdown/');
  if (Platform.OS === 'android') {
    let hasPermission = await Storage.requestPermission();
    if (!hasPermission) {
      ToastEvent.show({
        heading: 'Cannot export',
        message: 'You must provide phone storage access to backup data.',
        type: 'error',
        context: 'local',
      });
      return null;
    }
  }

  RNFetchBlob = require('rn-fetch-blob').default;

  let converter = new showdown.Converter();
  converter.setFlavor("original");
  let dom = jsdom.html();
  let content = await db.notes.note(note.id).content();
  let markdown = converter.makeMarkdown(content, dom);

  markdown = await db.notes.note(note.id).export('md', markdown);

  let fileName = sanitizeFilename(note.title, {replacement: '_'});
  path = path + fileName + '.md';

  await RNFetchBlob.fs.writeFile(path, markdown, 'utf8');

  return {
    filePath: path,
    type: 'text/markdown',
    name: 'Markdown',
  };
}

async function saveToText(note) {
  let path = await Storage.checkAndCreateDir('/exported/Text/');
  if (Platform.OS === 'android') {
    let hasPermission = await Storage.requestPermission();
    if (!hasPermission) {
      ToastEvent.show({
        heading: 'Cannot export',
        message: 'You must provide phone storage access to backup data.',
        type: 'error',
        context: 'local',
      });
      return null;
    }
  }
  RNFetchBlob = require('rn-fetch-blob').default;
  let text = await db.notes.note(note.id).export('txt');

  let fileName = sanitizeFilename(note.title, {replacement: '_'});
  path = path + fileName + '.txt';

  await RNFetchBlob.fs.writeFile(path, text, 'utf8');

  return {
    filePath: path,
    type: 'text/plain',
    name: 'Text',
  };
}

async function saveToHTML(note) {
  let path = await Storage.checkAndCreateDir('/exported/Html/');
  if (Platform.OS === 'android') {
    let hasPermission = await Storage.requestPermission();
    if (!hasPermission) {
      ToastEvent.show({
        heading: 'Cannot export',
        message: 'You must provide phone storage access to backup data.',
        type: 'error',
        context: 'local',
      });
      return null;
    }
  }
  RNFetchBlob = require('rn-fetch-blob').default;
  let html = await db.notes.note(note.id).export('html');
  let fileName = sanitizeFilename(note.title, {replacement: '_'});
  path = path + fileName + '.html';
  await RNFetchBlob.fs.writeFile(path, html, 'utf8');

  return {
    filePath: path,
    type: 'text/html',
    name: 'Html',
  };
}

export default {
  saveToHTML,
  saveToText,
  saveToMarkdown,
  saveToPDF,
};
