import { decode, EntityLevel } from 'entities';
import { Platform } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf-lite';
import * as ScopedStorage from 'react-native-scoped-storage';
import RNFetchBlob from 'rn-fetch-blob';
import { toTXT } from '../utils';
import { db } from '../utils/database';
import { sanitizeFilename } from '../utils/sanitizer';
import Storage from '../utils/database/storage';

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
  color: #505050
}

h1,
h2,
h3,
h4,
h5,
h6 {
  color: #212121
}

pre.codeblock {
  overflow-x:auto;
}

iframe {
  max-width:100% !important;
  background-color:transparent !important;
}

.tox-checklist > li,
.checklist > li {
  list-style: none;
  margin: 0.25em 0;
}

.tox-checklist > li::before,
.checklist > li::before {
  content: url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cg%20id%3D%22checklist-unchecked%22%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Crect%20id%3D%22Rectangle%22%20width%3D%2215%22%20height%3D%2215%22%20x%3D%22.5%22%20y%3D%22.5%22%20fill-rule%3D%22nonzero%22%20stroke%3D%22%234C4C4C%22%20rx%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E%0A');
  cursor: pointer;
  height: 1.1em;
  margin-left: -2.5em;
  margin-top: 0.125em;
  position: absolute;
  width: 1.5em;
  padding-left: 1em;
}

.tox-checklist li.tox-checklist--checked::before,
.checklist li.checked::before {
  content: url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cg%20id%3D%22checklist-checked%22%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Crect%20id%3D%22Rectangle%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%23008837%22%20fill-rule%3D%22nonzero%22%20rx%3D%222%22%2F%3E%3Cpath%20id%3D%22Path%22%20fill%3D%22%23FFF%22%20fill-rule%3D%22nonzero%22%20d%3D%22M11.5703186%2C3.14417309%20C11.8516238%2C2.73724603%2012.4164781%2C2.62829933%2012.83558%2C2.89774797%20C13.260121%2C3.17069355%2013.3759736%2C3.72932262%2013.0909105%2C4.14168582%20L7.7580587%2C11.8560195%20C7.43776896%2C12.3193404%206.76483983%2C12.3852142%206.35607322%2C11.9948725%20L3.02491697%2C8.8138662%20C2.66090143%2C8.46625845%202.65798871%2C7.89594698%203.01850234%2C7.54483354%20C3.373942%2C7.19866177%203.94940006%2C7.19592841%204.30829608%2C7.5386474%20L6.85276923%2C9.9684299%20L11.5703186%2C3.14417309%20Z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E%0A');
}

.tox-checklist li.tox-checklist--checked,
.checklist li.checked {
  color:gray
}

[dir="rtl"] .tox-checklist > li::before,
[dir="rtl"] .checklist > li::before {
  margin-left: 0;
  margin-right: -1.5em;
}

/* TABLE */

table {
  table-layout: fixed;
  border-collapse: separate !important;
  border-spacing: 0px;
  border: none !important;
  border-radius: 5px;
  font-size: 14px;
  min-width: 100% !important;
}

.table-container {
  border: 1px solid #e8e8e8 !important;
  border-radius: 5px;
  overflow-x: auto;
  max-width: 100%;
}

tr td,
tr th {
  padding: 5px !important;
  border: 1px solid #e8e8e8 !important;
}

thead tr td,
tbody tr td,
thead tr th,
tbody tr th {
  border-left: none !important;
  border-top: none !important;
}


tfoot tr td,
tfoot tr th, {
  border-left: none !important;
}

table caption,
thead td {
  border-bottom: 1px solid #e8e8e8 !important;
}

tfoot td {
  border-top: 1px solid #e8e8e8 !important;
}

td:last-child {
  border-right: none !important;
}

tbody tr:last-child td {
  border-bottom: none !important;
}

tr:nth-child(even) {
  background-color: #f7f7f7;
}

table thead {
  font-weight: bold !important;
}

td,
th {
  min-width:100px !important;
}

td > *,
th > * {
  margin: 0 !important;
}

td > * + *,
th > * + * {
  margin-top: 0.75em !important;
}

td[data-mce-selected]::after,
th[data-mce-selected]::after {
  background-color: #00883712 !important;
  border: 1px solid #00883712 !important;
  bottom: -1px;
  content: "";
  left: -1px;
  mix-blend-mode: multiply;
  position: absolute;
  right: -1px;
  top: -1px;
}

table td:hover {
  background-color: #00883712;
}

table[data-mce-selected] tr[data-mce-active] {
  background-color: #00883712;
  /* color: var(--static); */
}

table[data-mce-selected]
  tr[data-mce-active]
  td:not([data-mce-active]),
 table[data-mce-selected]
  tr[data-mce-active]
  th:not([data-mce-active]) {
  border-bottom: 1px solid ${'#008837' + 'B3'} !important;
  border-top: 1px solid ${'#008837' + 'B3'} !important;
}

table[data-mce-selected]
  tr[data-mce-active]
  td:not([data-mce-active]):first-child,
table[data-mce-selected]
  tr[data-mce-active]
  th:not([data-mce-active]):first-child {
  border-left: 1px solid ${'#008837' + 'B3'} !important;
}

table[data-mce-selected]
  tr[data-mce-active]
  td:not([data-mce-active]):last-child,
table[data-mce-selected]
  tr[data-mce-active]
  th:not([data-mce-active]):last-child {
  border-right: 1px solid ${'#008837' + 'B3'} !important;
}

table[data-mce-selected] td[data-mce-active],
table[data-mce-selected] th[data-mce-active] {
  border: 2px solid ${'#008837' + 'B3'} !important;
  background-color: #00883712;
}

.hljs {
  color: #383a42;
  background: #fafafa;
  border:1px solid #e8e8e8;
  border-radius: 5px;
  padding: 3px 5px 0px 5px;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono,
    Menlo, monospace !important;
  font-size: 10pt !important;
}

.hljs-comment,
.hljs-quote {
  color: #a0a1a7;
  font-style: italic;
}

.hljs-doctag,
.hljs-keyword,
.hljs-formula {
  color: #a626a4;
}

.hljs-section,
.hljs-name,
.hljs-selector-tag,
.hljs-deletion,
.hljs-subst {
  color: #e45649;
}

.hljs-literal {
  color: #0184bb;
}

.hljs-string,
.hljs-regexp,
.hljs-addition,
.hljs-attribute,
.hljs-meta .hljs-string {
  color: #50a14f;
}

.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-type,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-number {
  color: #986801;
}

.hljs-symbol,
.hljs-bullet,
.hljs-link,
.hljs-meta,
.hljs-selector-id,
.hljs-title {
  color: #4078f2;
}

.hljs-built_in,
.hljs-title.class_,
.hljs-class .hljs-title {
  color: #c18401;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: 600;
}

.hljs-link {
  text-decoration: underline;
}

hr {
  border-color: #b1b1b1 !important;
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
  html = decode(html, {
    level: EntityLevel.HTML
  });
  let fileName = sanitizeFilename(note.title + Date.now(), { replacement: '_' });
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
  let path = Platform.OS === 'ios' && (await Storage.checkAndCreateDir('/exported/Markdown/'));
  if (Platform.OS === 'android') {
    let file = await ScopedStorage.openDocumentTree(true);
    if (!file) return;
    path = file.uri;
  }

  let markdown = await db.notes.note(note.id).export('md', markdown);
  let fileName = sanitizeFilename(note.title + Date.now(), { replacement: '_' });

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
  let path = Platform.OS === 'ios' && (await Storage.checkAndCreateDir('/exported/Text/'));
  if (Platform.OS === 'android') {
    let file = await ScopedStorage.openDocumentTree(true);
    if (!file) return;
    path = file.uri;
  }

  let text = await toTXT(note);
  let fileName = sanitizeFilename(note.title + Date.now(), { replacement: '_' });

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
  let path = Platform.OS === 'ios' && (await Storage.checkAndCreateDir('/exported/Html/'));
  if (Platform.OS === 'android') {
    let file = await ScopedStorage.openDocumentTree(true);
    if (!file) return;
    path = file.uri;
  }

  let html = await db.notes.note(note.id).export('html');
  let fileName = sanitizeFilename(note.title + Date.now(), { replacement: '_' });
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
