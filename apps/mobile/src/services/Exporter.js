import jsdom from 'jsdom-jscore-rn';
import { Platform } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf-lite';
import * as ScopedStorage from 'react-native-scoped-storage';
import showdown from 'showdown';
import { db } from '../utils/database';
import { sanitizeFilename } from '../utils/filename';
import Storage from '../utils/storage';

let RNFetchBlob;

const defaultStyle = `<style>
.img_size_one {
  width:100%;
}
.img_size_two {
  width:50%; 
}
.img_size_three {
  width:25%;
} 
img {
  max-width:100% !important;
  height:auto !important;
}

.img_float_left {
  float:left;
}
.img_float_right {
  float:right;
}
.img_float_none {
  float:none;
}
body {
  background-color:transparent !important;
}
pre.codeblock {
  overflow-x:auto;
}

iframe {
  max-width:100% !important;
  background-color:transparent !important;
}
table {
  display: block !important;
  max-width:100% !important;
  width:100% !important;
  table-layout:fixed;
  border-width:0;
}
td {
  padding:5px;
  border-width:0.5px;
  border-style:solid;
}
</style>`;

async function saveToPDF(note) {
  let androidSavePath = '/Notesnook/exported/PDF';
  if (Platform.OS === 'android') {
    let file = await ScopedStorage.openDocumentTree(true);
    if (!file) return;
    androidSavePath = file.uri;
  }

  Platform.OS === 'ios' && (await Storage.checkAndCreateDir('/exported/PDF/'));

  let html = await db.notes.note(note).export('html');
  let he = require('he');
  html = he.decode(html);
  let fileName = sanitizeFilename(note.title + Date.now(), {replacement: '_'});
  let html3 = html;
  if (html.indexOf('<head>') > -1) {
    let html1 = html.substring(0, html.indexOf('<head>') + 6);
    let html2 = html.substring(html.indexOf('<head>') + 6);
    html3 = html1 + defaultStyle + html2;
  }

  let options = {
    html: html3,
    fileName: Platform.OS === 'ios' ? '/exported/PDF/' + fileName : fileName,
    width: 595,
    height: 852,
    bgColor: '#FFFFFF',
    padding: 30,
    base64: Platform.OS === 'android'
  };
  if (Platform.OS === 'ios') {
    options.directory = 'Documents';
  }
  let res = await RNHTMLtoPDF.convert(options);

  let fileUri;
  if (Platform.OS === 'android') {
    fileUri = await ScopedStorage.writeFile(
      androidSavePath,
      fileName,
      'application/pdf',
      res.base64,
      'base64',
      false
    );
    await ScopedStorage.releasePersistableUriPermission(androidSavePath);
    if (res.filePath) {
      await RNFetchBlob.fs.unlink(res.filePath);
    }
  }

  return {
    filePath: fileUri || res.filePath,
    type: 'application/pdf',
    name: 'PDF',
    fileName: fileName
  };
}

async function saveToMarkdown(note) {
  let path =
    Platform.OS === 'ios' &&
    (await Storage.checkAndCreateDir('/exported/Markdown/'));
  if (Platform.OS === 'android') {
    let file = await ScopedStorage.openDocumentTree(true);
    if (!file) return;
    path = file.uri;
  }

  RNFetchBlob = require('rn-fetch-blob').default;

  let converter = new showdown.Converter();
  converter.setFlavor('original');
  let dom = jsdom.html();
  let content = await db.notes.note(note.id).content();
  let markdown = converter.makeMarkdown(content, dom);

  markdown = await db.notes.note(note.id).export('md', markdown);

  let fileName = sanitizeFilename(note.title + Date.now(), {replacement: '_'});

  let fileUri;
  if (Platform.OS === 'android') {
    fileUri = await ScopedStorage.writeFile(
      path,
      fileName + '.md',
      'text/markdown',
      markdown,
      'utf8',
      false
    );
    await ScopedStorage.releasePersistableUriPermission(path);
  } else {
    path = path + fileName + '.md';
    await RNFetchBlob.fs.writeFile(path, markdown, 'utf8');
  }

  return {
    filePath: fileUri || path,
    type: 'text/markdown',
    name: 'Markdown',
    fileName: fileName
  };
}

async function saveToText(note) {
  let path =
    Platform.OS === 'ios' &&
    (await Storage.checkAndCreateDir('/exported/Text/'));
  if (Platform.OS === 'android') {
    let file = await ScopedStorage.openDocumentTree(true);
    if (!file) return;
    path = file.uri;
  }

  RNFetchBlob = require('rn-fetch-blob').default;
  let text = await db.notes.note(note.id).export('txt');

  let fileName = sanitizeFilename(note.title + Date.now(), {replacement: '_'});

  let fileUri;
  if (Platform.OS === 'android') {
    fileUri = await ScopedStorage.writeFile(
      path,
      fileName + '.txt',
      'text/plain',
      text,
      'utf8',
      false
    );
    await ScopedStorage.releasePersistableUriPermission(path);
  } else {
    path = path + fileName + '.txt';
    await RNFetchBlob.fs.writeFile(path, text, 'utf8');
  }

  return {
    filePath: fileUri || path,
    type: 'text/plain',
    name: 'Text',
    fileName: fileName
  };
}

async function saveToHTML(note) {
  let path =
    Platform.OS === 'ios' &&
    (await Storage.checkAndCreateDir('/exported/Html/'));
  if (Platform.OS === 'android') {
    let file = await ScopedStorage.openDocumentTree(true);
    if (!file) return;
    path = file.uri;
  }

  RNFetchBlob = require('rn-fetch-blob').default;
  let html = await db.notes.note(note.id).export('html');
  let fileName = sanitizeFilename(note.title + Date.now(), {replacement: '_'});
  let html3 = html;
  if (html.indexOf('<head>') > -1) {
    let html1 = html.substring(0, html.indexOf('<head>') + 6);
    let html2 = html.substring(html.indexOf('<head>') + 6);
    html3 = html1 + defaultStyle + html2;
  }

  let fileUri;
  if (Platform.OS === 'android') {
    fileUri = await ScopedStorage.writeFile(
      path,
      fileName + '.html',
      'text/html',
      html3,
      'utf8',
      false
    );
    await ScopedStorage.releasePersistableUriPermission(path);
  } else {
    path = path + fileName + '.html';
    await RNFetchBlob.fs.writeFile(path, html3, 'utf8');
  }

  return {
    filePath: fileUri || path,
    type: 'text/html',
    name: 'Html',
    fileName: fileName
  };
}

export default {
  saveToHTML,
  saveToText,
  saveToMarkdown,
  saveToPDF
};
