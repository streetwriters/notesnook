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

import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import RNHTMLtoPDF from "react-native-html-to-pdf-lite";
import * as ScopedStorage from "react-native-scoped-storage";
import { zip } from "react-native-zip-archive";
import { DatabaseLogger } from "../common/database/index";

import {
  exportNote as _exportNote,
  ExportableAttachment,
  ExportableNote,
  exportNotes
} from "@notesnook/common";
import { FilteredSelector, Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { basename, dirname, extname, join } from "pathe";
import filesystem from "../common/filesystem";
import downloadAttachment from "../common/filesystem/download-attachment";
import { cacheDir } from "../common/filesystem/utils";
import { unlockVault } from "../utils/unlock-vault";

const FolderNames: { [name: string]: string } = {
  txt: "Text",
  pdf: "PDF",
  md: "Markdown",
  html: "Html"
};

async function getPath(type: string) {
  let path =
    Platform.OS === "ios" &&
    (await filesystem.checkAndCreateDir(`/exported/${type}/`));

  if (Platform.OS === "android") {
    const file = await ScopedStorage.openDocumentTree(true);
    if (!file) return;
    path = file.uri;
  }
  return path;
}

async function unlockVaultForNoteExport() {
  return await unlockVault({
    title: strings.unlockNotes(),
    paragraph: strings.exportedNotesLocked(),
    context: "export-notes"
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
    unlockVault: unlockVaultForNoteExport as () => Promise<boolean>
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
  let hasAttachments = false;
  let noteItem;
  for await (const item of _exportNote(note, {
    format: type,
    unlockVault: unlockVaultForNoteExport as () => Promise<boolean>
  })) {
    if (item instanceof Error) {
      DatabaseLogger.error(item);
      continue;
    }

    if (item.type === "note") {
      callback(`Exporting note`);
      try {
        noteItem = item;
        await exportNoteToFile(item, type, mkdir, writeFile);
      } catch (e) {
        console.log("exportNoteToFile", item.type, e);
      }
    } else if (item.type === "attachment") {
      currentAttachmentProgress += 1;
      callback(`Downloading attachments (${currentAttachmentProgress})`);
      try {
        hasAttachments = true;
        await exportAttachmentToFile(item, mkdir, cacheFolder);
      } catch (e) {
        console.log("exportAttachmentToFile", item.path, e);
      }
    }
  }

  if (!hasAttachments) {
    console.log("creating file...");
    return createFile(noteItem as ExportableNote, type, path, cacheFolder);
  } else {
    return createZip(1, cacheFolder, type, path, callback);
  }
}

async function createZip(
  totalNotes: number,
  cacheFolder: string,
  type: "txt" | "pdf" | "md" | "html" | "md-frontmatter",
  path: string,
  callback: (progress?: string) => void
) {
  const fileName = `nn-export-${totalNotes}-${type}-${Date.now()}.zip`;
  const dir = path;
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
    } else {
      path = zipOutputPath;
    }
    RNFetchBlob.fs.unlink(cacheFolder);
  } catch (e) {
    DatabaseLogger.error(e as Error);
  }

  return {
    filePath: path,
    fileDir: dir,
    type: "application/zip",
    name: "zip",
    fileName: fileName,
    count: totalNotes
  };
}

async function createFile(
  noteItem: ExportableNote,
  type: keyof typeof FileMime,
  path: string,
  cacheFolder: string
) {
  const exportedFile = join(cacheFolder, noteItem?.path as string);
  let filePath: string;
  if (Platform.OS === "android") {
    const file = await ScopedStorage.createFile(
      path,
      basename(noteItem?.path as string),
      FileMime[type]
    );
    await copyFileAsync("file://" + exportedFile, file.uri);
    filePath = file.uri;
  } else {
    const originalPath = join(path, basename(noteItem.path));
    filePath = originalPath;
    const ext = extname(originalPath);
    let id = 1;
    while (await RNFetchBlob.fs.exists(filePath)) {
      filePath = originalPath.replace(`${ext}`, "") + "_" + id + ext;
      id++;
    }
    console.log("path", filePath);
    await RNFetchBlob.fs.mv(exportedFile, filePath);
  }
  console.log("file moved...");
  return {
    filePath: filePath,
    fileDir: path,
    type: FileMime[type],
    name: type,
    fileName: basename(noteItem?.path as string),
    count: 1
  };
}

const FileMime = {
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  html: "text/html",
  "md-frontmatter": "text/markdown"
};

const Exporter = {
  exportNote,
  bulkExport
};

export default Exporter;
