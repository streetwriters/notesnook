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

import {
  exportNote as _exportNote,
  ExportableAttachment,
  ExportableNote,
  exportNotes,
  sanitizeFilename
} from "@notesnook/common";
import { Note } from "@notesnook/core";
import { NoteContent } from "@notesnook/core/dist/collections/session-content";
import { FilteredSelector } from "@notesnook/core/dist/database/sql-collection";
import { basename, dirname, join } from "pathe";
import downloadAttachment from "../common/filesystem/download-attachment";
import { presentDialog } from "../components/dialog/functions";
import { useSettingStore } from "../stores/use-setting-store";
import BiometicService from "./biometrics";
import { ToastManager } from "./event-manager";
import { cacheDir } from "../common/filesystem/utils";

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

function copyFileAsync(source: string, dest: string) {
  return new Promise((resolve) => {
    ScopedStorage.copyFile(source, dest, () => {
      resolve(true);
    });
  });
}

async function resolveFileFunctions(
  type: "txt" | "pdf" | "md" | "html" | "md-frontmatter"
) {
  const path = await getPath(FolderNames[type]);
  if (!path) return;

  const exportCacheFolder = join(
    RNFetchBlob.fs.dirs.CacheDir,
    `/export_${Date.now()}`
  );

  await RNFetchBlob.fs.mkdir(exportCacheFolder).catch((e) => console.log(e));

  const mkdir = async (dir: string) => {
    const folder = join(exportCacheFolder, dir);
    if (!(await RNFetchBlob.fs.exists(folder))) {
      await RNFetchBlob.fs.mkdir(folder);
    }
  };

  const writeFile = async (path: string, result: string) => {
    const cacheFilePath = join(exportCacheFolder, path);
    console.log(cacheFilePath, result.length);
    await RNFetchBlob.fs.writeFile(
      cacheFilePath,
      result,
      type === "pdf" ? "base64" : "utf8"
    );
  };
  return {
    path,
    cacheFolder: exportCacheFolder,
    mkdir,
    writeFile
  };
}

async function createZip(
  totalNotes: number,
  cacheFolder: string,
  type: "txt" | "pdf" | "md" | "html" | "md-frontmatter",
  path: string,
  callback: (progress?: string) => void
) {
  const fileName = `nn-export-${totalNotes}-${type}-${Date.now()}.zip`;
  try {
    callback("Creating zip");
    const zipOutputPath =
      Platform.OS === "ios"
        ? join(path, fileName)
        : join(RNFetchBlob.fs.dirs.CacheDir, fileName);
    await zip(cacheFolder, zipOutputPath);
    callback("Saving zip file");
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
    RNFetchBlob.fs.unlink(cacheFolder);
  } catch (e) {
    DatabaseLogger.error(e as Error);
  }

  return {
    filePath: path,
    type: "application/zip",
    name: "zip",
    fileName: fileName,
    count: totalNotes
  };
}

async function exportNoteToFile(
  item: ExportableNote,
  type: "txt" | "pdf" | "md" | "html" | "md-frontmatter",
  mkdir: (dir: string) => Promise<void>,
  writeFile: (path: string, result: string) => Promise<void>
) {
  const dir = dirname(item.path);
  const filename = basename(item.path);
  await mkdir(dir);
  if (type === "pdf") {
    const options = {
      html: item.data,
      fileName: Platform.OS === "ios" ? "/exported/PDF/" + filename : filename,
      width: 595,
      height: 852,
      bgColor: "#FFFFFF",
      padding: 30,
      base64: true
    } as { [name: string]: any };

    if (Platform.OS === "ios") {
      options.directory = "Documents";
    }
    const res = await RNHTMLtoPDF.convert(options);
    if (res.filePath) {
      RNFetchBlob.fs.unlink(res.filePath);
    }
    await writeFile(item.path, res.base64);
  } else {
    await writeFile(item.path, item.data);
  }
}

async function exportAttachmentToFile(
  item: ExportableAttachment,
  mkdir: (dir: string) => Promise<void>,
  cacheFolder: string
) {
  const dir = dirname(item.path);
  await mkdir(dir);
  const cacheFileName = await downloadAttachment(item.data.hash, true, {
    silent: true,
    cache: true,
    throwError: false
  } as any);

  await RNFetchBlob.fs.mv(
    join(cacheDir, cacheFileName as string),
    join(cacheFolder, item.path)
  );
}

async function bulkExport(
  notes: FilteredSelector<Note>,
  type: "txt" | "pdf" | "md" | "html" | "md-frontmatter",
  callback: (progress?: string) => void
) {
  const totalNotes = await notes.count();

  const fileFuncions = await resolveFileFunctions(type);

  if (!fileFuncions) return;

  const path = fileFuncions.path;
  const { mkdir, writeFile, cacheFolder } = fileFuncions;

  let currentProgress = 0;
  let currentAttachmentProgress = 0;
  for await (const item of exportNotes(notes, {
    format: type,
    unlockVault: unlockVault as () => Promise<boolean>
  })) {
    if (item instanceof Error) {
      DatabaseLogger.error(item);
      continue;
    }

    if (item.type === "note") {
      currentProgress += 1;
      callback(`Exporting notes (${currentProgress}/${totalNotes})`);
      try {
        await exportNoteToFile(item, type, mkdir, writeFile);
      } catch (e) {
        console.log(item.type, e);
      }
    } else if (item.type === "attachment") {
      currentAttachmentProgress += 1;
      callback(`Downloading attachments (${currentAttachmentProgress})`);
      try {
        await exportAttachmentToFile(item, mkdir, cacheFolder);
      } catch (e) {
        console.log(item.path, e);
      }
    }
  }
  console.log(cacheFolder);
  return createZip(totalNotes, cacheFolder, type, path, callback);
}

async function exportNote(
  note: Note,
  type: "txt" | "pdf" | "md" | "html" | "md-frontmatter",
  callback: (progress?: string) => void
) {
  const fileFuncions = await resolveFileFunctions(type);

  if (!fileFuncions) return;

  const path = fileFuncions.path;
  const { mkdir, writeFile, cacheFolder } = fileFuncions;

  let currentAttachmentProgress = 0;
  for await (const item of _exportNote(note, {
    format: type,
    unlockVault: unlockVault as () => Promise<boolean>
  })) {
    if (item instanceof Error) {
      DatabaseLogger.error(item);
      continue;
    }

    if (item.type === "note") {
      callback(`Exporting note`);
      try {
        await exportNoteToFile(item, type, mkdir, writeFile);
      } catch (e) {
        console.log("exportNoteToFile", item.type, e);
      }
    } else if (item.type === "attachment") {
      currentAttachmentProgress += 1;
      callback(`Downloading attachments (${currentAttachmentProgress})`);
      try {
        await exportAttachmentToFile(item, mkdir, cacheFolder);
      } catch (e) {
        console.log("exportAttachmentToFile", item.path, e);
      }
    }
  }

  return createZip(1, cacheFolder, type, path, callback);
}

const Exporter = {
  exportNote,
  bulkExport
};

export default Exporter;
