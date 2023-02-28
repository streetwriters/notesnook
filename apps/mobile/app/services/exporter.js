/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { decode, EntityLevel } from "entities";
import { zipSync } from "fflate";
import { Platform } from "react-native";
import RNHTMLtoPDF from "react-native-html-to-pdf-lite";
import * as ScopedStorage from "react-native-scoped-storage";
import RNFetchBlob from "rn-fetch-blob";
import { DatabaseLogger, db } from "../common/database/index";
import Storage from "../common/database/storage";
import { toTXT } from "../utils";
import { sanitizeFilename } from "../utils/sanitizer";
import { sleep } from "../utils/time";

const MIMETypes = {
  txt: "text/plain",
  pdf: "application/pdf",
  md: "text/markdown",
  html: "text/html"
};

const FolderNames = {
  txt: "Text",
  pdf: "PDF",
  md: "Markdown",
  html: "Html"
};

async function releasePermissions(path) {
  if (Platform.OS === "ios") return;
  const uris = await ScopedStorage.getPersistedUriPermissions();
  for (let uri of uris) {
    if (path.startsWith(uri)) {
      await ScopedStorage.releasePersistableUriPermission(uri);
    }
  }
}

/**
 *
 * @param {"Text" | "PDF" | "Markdown" | "Html" } type
 * @returns
 */
async function getPath(type) {
  let path =
    Platform.OS === "ios" &&
    (await Storage.checkAndCreateDir(`/exported/${type}/`));

  if (Platform.OS === "android") {
    let file = await ScopedStorage.openDocumentTree(true);
    if (!file) return;
    path = file.uri;
  }
  return path;
}

/**
 *
 * @param {string} path
 * @param {string} data
 * @param {string} title
 * @param {"txt" | "pdf" | "md" | "html"} extension
 * @returns
 */
async function save(path, data, fileName, extension) {
  let uri;
  if (Platform.OS === "android") {
    uri = await ScopedStorage.writeFile(
      path,
      data,
      `${fileName}_${Date.now()}_.${extension}`,
      MIMETypes[extension],
      extension === "pdf" ? "base64" : "utf8",
      false
    );
    await releasePermissions(path);
  } else {
    path = path + fileName + `.${extension}`;
    await RNFetchBlob.fs.writeFile(path, data, "utf8");
  }
  return uri || path;
}

async function makeHtml(note) {
  let html = await db.notes.note(note.id).export("html");
  html = decode(html, {
    level: EntityLevel.HTML
  });
  return html;
}

/**
 *
 * @param {"txt" | "pdf" | "md" | "html"} type
 */
async function exportAs(type, note, bulk) {
  let data;
  switch (type) {
    case "html":
      {
        data = await makeHtml(note);
      }
      break;
    case "md":
      data = await db.notes.note(note.id).export("md");
      break;
    case "pdf":
      {
        let html = await makeHtml(note);
        console.log(html);
        let fileName = sanitizeFilename(note.title + Date.now(), {
          replacement: "_"
        });

        let options = {
          html: html,
          fileName:
            Platform.OS === "ios" ? "/exported/PDF/" + fileName : fileName,
          width: 595,
          height: 852,
          bgColor: "#FFFFFF",
          padding: 30,
          base64: bulk || Platform.OS === "android"
        };
        if (Platform.OS === "ios") {
          options.directory = "Documents";
        }
        let res = await RNHTMLtoPDF.convert(options);
        data = !bulk && Platform.OS === "ios" ? res.filePath : res.base64;
        if (bulk && res.filePath) {
          RNFetchBlob.fs.unlink(res.filePath);
        }
      }
      break;
    case "txt":
      data = await toTXT(note);
      break;
  }

  return data;
}

/**
 *
 * @param {"txt" | "pdf" | "md" | "html"} type
 */
async function exportNote(note, type) {
  let path = await getPath(FolderNames[type]);
  if (!path) return;
  let result = await exportAs(type, note);
  if (!result) return null;
  let fileName = sanitizeFilename(note.title + Date.now(), {
    replacement: "_"
  });

  if (type === "pdf" && Platform.OS === "ios") {
    path = result;
  } else {
    path = await save(path, result, fileName, type);
  }

  return {
    filePath: path,
    type: "text/plain",
    name: "Text",
    fileName: fileName + `.${type}`
  };
}

function copyFileAsync(source, dest) {
  return new Promise((resolve) => {
    ScopedStorage.copyFile(source, dest, () => {
      resolve();
    });
  });
}

function zipsync(results) {
  let data = zipSync(results);
  return Buffer.from(data.buffer).toString("base64");
}

function getUniqueFileName(fileName, results) {
  const chunks = fileName.split(".");
  const ext = chunks.pop();
  const name = chunks.join(".");
  let resolvedName = fileName;
  let count = 0;
  while (results[resolvedName]) {
    resolvedName = `${name}${++count}.${ext}`;
  }

  return resolvedName;
}

/**
 *
 * @param {"txt" | "pdf" | "md" | "html"} type
 */
async function bulkExport(notes, type, callback) {
  let path = await getPath(FolderNames[type]);
  if (!path) return;

  const results = {};
  for (var i = 0; i < notes.length; i++) {
    try {
      await sleep(1);
      let note = notes[i];
      if (note.locked) continue;
      let result = await exportAs(type, note);
      let fileName = sanitizeFilename(note.title + Date.now(), {
        replacement: "_"
      });
      if (result) {
        results[getUniqueFileName(fileName + `.${type}`, results)] =
          Buffer.from(result, type === "pdf" ? "base64" : "utf-8");
      }
      callback(`${i + 1}/${notes.length}`);
    } catch (e) {
      DatabaseLogger.error(e);
    }
  }
  const fileName = `nn-export-${notes.length}-${type}-${Date.now()}.zip`;

  try {
    callback("zipping");
    await sleep(1);
    const zipped = zipsync(results);
    callback("saving to disk");
    await sleep(1);

    if (Platform.OS === "ios") {
      RNFetchBlob.fs.writeFile(path + `/${fileName}`, zipped, "base64");
    } else {
      const templFile = RNFetchBlob.fs.dirs.CacheDir + `/${fileName}`;
      await RNFetchBlob.fs.writeFile(templFile, zipped, "base64");
      const file = await ScopedStorage.createFile(
        path,
        fileName,
        "application/zip"
      );
      path = file.uri;
      await copyFileAsync("file://" + templFile, path);
      await RNFetchBlob.fs.unlink(templFile);
      callback();
    }
  } catch (e) {
    DatabaseLogger.error(e);
  }

  return {
    filePath: path,
    type: "application/zip",
    name: "zip",
    fileName: fileName,
    count: results?.length || 0
  };
}

const Exporter = {
  exportNote,
  bulkExport
};

export default Exporter;
