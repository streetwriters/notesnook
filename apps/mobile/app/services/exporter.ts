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
import { Note } from "@notesnook/core";
import { NoteContent } from "@notesnook/core/dist/collections/session-content";
import { presentDialog } from "../components/dialog/functions";
import { useSettingStore } from "../stores/use-setting-store";
import BiometicService from "./biometrics";
import { ToastManager } from "./event-manager";

const MIMETypes = {
  txt: "text/plain",
  pdf: "application/pdf",
  md: "text/markdown",
  "md-frontmatter": "text/markdown",
  html: "text/html"
};

const FolderNames: { [name: string]: string } = {
  txt: "Text",
  pdf: "PDF",
  md: "Markdown",
  html: "Html"
};

async function releasePermissions(path: string) {
  if (Platform.OS === "ios") return;
  const uris = await ScopedStorage.getPersistedUriPermissions();
  for (const uri of uris) {
    if (path.startsWith(uri)) {
      await ScopedStorage.releasePersistableUriPermission(uri);
    }
  }
}

async function getPath(type: string) {
  let path =
    Platform.OS === "ios" &&
    (await Storage.checkAndCreateDir(`/exported/${type}/`));

  if (Platform.OS === "android") {
    const file = await ScopedStorage.openDocumentTree(true);
    if (!file) return;
    path = file.uri;
  }
  return path;
}

async function save(
  path: string,
  data: string,
  fileName: string,
  extension: "txt" | "pdf" | "md" | "html" | "md-frontmatter"
) {
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

async function makeHtml(note: Note, content?: NoteContent<false>) {
  let html = await db.notes.export(note.id, {
    format: "html",
    contentItem: content
  });
  if (!html) return "";

  html = decode(html, {
    level: EntityLevel.HTML
  });
  return html;
}

async function exportAs(
  type: string,
  note: Note,
  bulk?: boolean,
  content?: NoteContent<false>
) {
  let data;
  switch (type) {
    case "html":
      {
        data = await makeHtml(note, content);
      }
      break;
    case "md":
      data = await db.notes.export(note.id, {
        format: "md",
        contentItem: content
      });
      break;
    case "md-frontmatter":
      data = await db.notes.export(note.id, {
        format: "md-frontmatter",
        contentItem: content
      });
      break;
    case "pdf":
      {
        const html = await makeHtml(note, content);
        const fileName = sanitizeFilename(note.title + Date.now(), {
          replacement: "_"
        });

        const options = {
          html: html,
          fileName:
            Platform.OS === "ios" ? "/exported/PDF/" + fileName : fileName,
          width: 595,
          height: 852,
          bgColor: "#FFFFFF",
          padding: 30,
          base64: bulk || Platform.OS === "android"
        } as { [name: string]: any };

        if (Platform.OS === "ios") {
          options.directory = "Documents";
        }
        const res = await RNHTMLtoPDF.convert(options);
        data = !bulk && Platform.OS === "ios" ? res.filePath : res.base64;
        if (bulk && res.filePath) {
          RNFetchBlob.fs.unlink(res.filePath);
        }
      }
      break;
    case "txt":
      {
        data = await db.notes.export(note.id, {
          format: "txt",
          contentItem: content
        });
      }
      break;
  }

  return data;
}

async function unlockVault() {
  const biometry = await BiometicService.isBiometryAvailable();
  const fingerprint = await BiometicService.hasInternetCredentials();
  if (biometry && fingerprint) {
    const credentials = await BiometicService.getCredentials(
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
            ToastManager.show({
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

async function exportNote(
  id: string,
  type: "txt" | "pdf" | "md" | "html" | "md-frontmatter"
) {
  const note = await db.notes.note(id);
  if (!note) return;

  let content;
  const locked = note && (await db.vaults.itemExists(note));
  if (locked) {
    try {
      const unlocked = await unlockVault();
      if (!unlocked) return null;
      const unlockedNote = await db.vault.open(note.id);
      content = unlockedNote?.content;
    } catch (e) {
      DatabaseLogger.error(e as Error);
    }
  }

  let path = await getPath(FolderNames[type]);
  if (!path) return;

  const result = await exportAs(type, note, false, content);
  if (!result) return null;
  const fileName = sanitizeFilename(note.title + Date.now(), {
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

function copyFileAsync(source: string, dest: string) {
  return new Promise((resolve) => {
    ScopedStorage.copyFile(source, dest, () => {
      resolve(true);
    });
  });
}

function getUniqueFileName(
  fileName: string,
  notebookPath: string,
  results: { [name: string]: boolean }
) {
  const chunks = fileName.split(".");
  const ext = chunks.pop();
  const name = chunks.join(".");
  let resolvedName = fileName;
  let count = 0;
  while (results[`${notebookPath}${resolvedName}`]) {
    resolvedName = `${name}${++count}.${ext}`;
  }

  return resolvedName;
}

async function bulkExport(
  ids: string[],
  type: "txt" | "pdf" | "md" | "html" | "md-frontmatter",
  callback: (progress?: string) => void
) {
  let path = await getPath(FolderNames[type]);
  if (!path) return;

  const exportCacheFolder =
    RNFetchBlob.fs.dirs.CacheDir + `/export_${Date.now()}`;

  await RNFetchBlob.fs.mkdir(exportCacheFolder).catch((e) => console.log(e));

  const mkdir = async (dir: string) => {
    const folder = `${exportCacheFolder}/${dir}`;
    if (!(await RNFetchBlob.fs.exists(folder))) {
      await RNFetchBlob.fs.mkdir(folder);
    }
  };

  const writeFile = async (path: string, result: string) => {
    const cacheFilePath = exportCacheFolder + path;
    await RNFetchBlob.fs.writeFile(
      cacheFilePath,
      result,
      type === "pdf" ? "base64" : "utf8"
    );
  };

  const results: { [name: string]: boolean } = {};
  for (let i = 0; i < ids.length; i++) {
    try {
      const note = await db.notes.note(ids[i]);
      if (!note) continue;

      let content;
      const locked = note && (await db.vaults.itemExists(note));
      if (locked) {
        try {
          const unlocked = !db.vault.unlocked ? await unlockVault() : true;
          if (!unlocked) {
            continue;
          }
          const unlockedNote = await db.vault.open(note.id);
          content = unlockedNote?.content;
        } catch (e) {
          DatabaseLogger.error(e as Error);
          continue;
        }
      }

      const result = await exportAs(type, note, true, content);
      const fileName = sanitizeFilename(note.title, {
        replacement: "_"
      });
      if (result) {
        const notebooks = await db.relations
          ?.to({ id: note.id, type: "note" }, "notebook")
          .resolve();

        for (const notebook of notebooks) {
          const notebookPath = (await db.notebooks.breadcrumbs(notebook.id))
            .map((notebook) => {
              return notebook.title + "/";
            })
            .join("");

          await mkdir(notebookPath);

          console.log("Dir created", notebookPath);

          const exportedNoteName = getUniqueFileName(
            fileName + `.${type}`,
            notebookPath,
            results
          );
          results[`${notebookPath}${exportedNoteName}`] = true;
          await writeFile(`/${notebookPath}${exportedNoteName}`, result);
        }

        if (!notebooks.length) {
          const exportedNoteName = getUniqueFileName(
            fileName + `.${type}`,
            "",
            results
          );
          results[exportedNoteName] = true;
          await writeFile(`/${exportedNoteName}`, result);
        }
      }
      callback(`${i + 1}/${ids.length}`);
    } catch (e) {
      DatabaseLogger.error(e as Error);
    }
  }
  const fileName = `nn-export-${ids.length}-${type}-${Date.now()}.zip`;

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
    DatabaseLogger.error(e as Error);
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
