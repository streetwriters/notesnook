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
import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import RNHTMLtoPDF from "react-native-html-to-pdf-lite";
import * as ScopedStorage from "react-native-scoped-storage";
import { zip } from "react-native-zip-archive";
import { DatabaseLogger, db } from "../common/database/index";
import Storage from "../common/database/storage";

import { sanitizeFilename } from "@notesnook/common";
import { presentDialog } from "../components/dialog/functions";
import { useSettingStore } from "../stores/use-setting-store";
import BiometicService from "./biometrics";
import { ToastEvent } from "./event-manager";

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
      `${fileName}.${extension}`,
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
  let html = await db.notes.export(note.id, {
    format: "html"
  });
  html = decode(html, {
    level: EntityLevel.HTML
  });
  return html;
}

/**
 *
 * @param {"txt" | "pdf" | "md" | "html" | "md-frontmatter"} type
 */
async function exportAs(type, note, bulk, content) {
  let data;
  switch (type) {
    case "html":
      {
        data = await makeHtml(note, content);
      }
      break;
    case "md":
      data = await db.notes.export(note.id, {
        format: "md"
      });
      break;
    case "md-frontmatter":
      data = await db.notes
        .note(note.id)
        .export("md-frontmatter", content?.data);
      break;
    case "pdf":
      {
        let html = await makeHtml(note, content);
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
      {
        data = await db.notes?.note(note.id).export("txt", content);
      }
      break;
  }

  return data;
}

async function unlockVault() {
  let biometry = await BiometicService.isBiometryAvailable();
  let fingerprint = await BiometicService.hasInternetCredentials("nn_vault");
  if (biometry && fingerprint) {
    let credentials = await BiometicService.getCredentials(
      "Unlock vault",
      "Unlock vault to export locked notes"
    );
    if (credentials) {
      return db.vault.unlock(credentials.password);
    }
  }
  useSettingStore.getState().setSheetKeyboardHandler(false);
  return new Promise((resolve) => {
    setImmediate(() => {
      presentDialog({
        context: "export-notes",
        input: true,
        secureTextEntry: true,
        positiveText: "Unlock",
        title: "Unlock vault",
        paragraph: "Some exported notes are locked, Unlock to export them",
        inputPlaceholder: "Enter password",
        positivePress: async (value) => {
          const unlocked = await db.vault.unlock(value);
          if (!unlocked) {
            ToastEvent.show({
              heading: "Invalid password",
              message: "Please enter a valid password",
              type: "error",
              context: "local"
            });
            return false;
          }
          resolve(unlocked);
          useSettingStore.getState().setSheetKeyboardHandler(true);
          return true;
        },
        onClose: () => {
          resolve(false);
          useSettingStore.getState().setSheetKeyboardHandler(true);
        }
      });
    });
  });
}

/**
 *
 * @param {"txt" | "pdf" | "md" | "html" | "md-frontmatter"} type
 */
async function exportNote(note, type) {
  let content;

  if (note.locked) {
    try {
      let unlocked = await unlockVault();
      if (!unlocked) return null;
      const unlockedNote = await db.vault.open(note.id);
      content = unlockedNote.content;
    } catch (e) {
      DatabaseLogger.error(e);
    }
  }

  let path = await getPath(FolderNames[type]);
  if (!path) return;

  let result = await exportAs(type, note, false, content);
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
    fileName: fileName + `.${type === "md-frontmatter" ? "md" : type}`
  };
}

function copyFileAsync(source, dest) {
  return new Promise((resolve) => {
    ScopedStorage.copyFile(source, dest, () => {
      resolve();
    });
  });
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
 * @param {"txt" | "pdf" | "md" | "html" | "md-frontmatter"} type
 */
async function bulkExport(notes, type, callback) {
  let path = await getPath(FolderNames[type]);
  if (!path) return;

  const exportCacheFolder =
    RNFetchBlob.fs.dirs.CacheDir + `/export_${Date.now()}`;

  await RNFetchBlob.fs.mkdir(exportCacheFolder).catch((e) => console.log(e));

  const mkdir = async (dir) => {
    const folder = `${exportCacheFolder}/${dir}`;
    if (!(await RNFetchBlob.fs.exists(folder))) {
      await RNFetchBlob.fs.mkdir(folder);
    }
  };

  const writeFile = async (path, result) => {
    const cacheFilePath = exportCacheFolder + path;
    await RNFetchBlob.fs.writeFile(
      cacheFilePath,
      result,
      type === "pdf" ? "base64" : "utf8"
    );
  };

  const results = {};
  for (var i = 0; i < notes.length; i++) {
    try {
      let note = notes[i];
      let content;
      if (note.locked) {
        try {
          let unlocked = !db.vault.unlocked ? await unlockVault() : true;
          if (!unlocked) {
            continue;
          }
          const unlockedNote = await db.vault.open(note.id);
          content = unlockedNote.content;
        } catch (e) {
          DatabaseLogger.error(e);
          continue;
        }
      }
      let result = await exportAs(type, note, true, content);
      let fileName = sanitizeFilename(note.title, {
        replacement: "_"
      });
      if (result) {
        const notebooks = [
          ...(db.relations
            ?.to({ id: note.id, type: "note" }, "notebook")
            .map((notebook) => ({
              title: notebook.title
            })) || []),
          ...(note.notebooks || []).map((ref) => {
            const notebook = db.notebooks?.notebook(ref.id);
            const topics = notebook?.topics.all || [];

            return {
              title: notebook?.title,
              topics: ref.topics
                .map((topicId) => topics.find((topic) => topic.id === topicId))
                .filter(Boolean)
            };
          })
        ];

        for (const notebook of notebooks) {
          results[notebook.title] = results[notebook.title] || {};
          await mkdir(notebook.title);

          if (notebook.topics && notebook.topics.length) {
            for (const topic of notebook.topics) {
              results[notebook.title][topic.title] =
                results[notebook.title][topic.title] || {};

              await mkdir(`${notebook.title}/${topic.title}`);
              const exportedNoteName = getUniqueFileName(
                fileName + `.${type}`,
                results[notebook.title][topic.title]
              );
              results[notebook.title][topic.title][exportedNoteName] = true;

              writeFile(
                `/${notebook.title}/${topic.title}/${exportedNoteName}`,
                result
              );
            }
          } else {
            const exportedNoteName = getUniqueFileName(
              fileName + `.${type}`,
              results[notebook.title]
            );
            results[notebook.title][exportedNoteName] = true;
            writeFile(`/${notebook.title}/${exportedNoteName}`, result);
          }
        }

        if (!notebooks.length) {
          const exportedNoteName = getUniqueFileName(
            fileName + `.${type}`,
            results
          );
          results[exportedNoteName] = true;
          writeFile(`/${exportedNoteName}`, result);
        }
      }
      callback(`${i + 1}/${notes.length}`);
    } catch (e) {
      DatabaseLogger.error(e);
    }
  }
  const fileName = `nn-export-${notes.length}-${type}-${Date.now()}.zip`;

  try {
    callback("zipping");
    const zipOutputPath =
      Platform.OS === "ios"
        ? path + `/${fileName}`
        : RNFetchBlob.fs.dirs.CacheDir + `/${fileName}`;
    await zip(exportCacheFolder, zipOutputPath);
    callback("saving to disk");
    if (Platform.OS === "android") {
      const file = await ScopedStorage.createFile(
        path,
        fileName,
        "application/zip"
      );
      path = file.uri;
      await copyFileAsync("file://" + zipOutputPath, path);
      await RNFetchBlob.fs.unlink(zipOutputPath);
      callback();
    }
    RNFetchBlob.fs.unlink(exportCacheFolder);
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
