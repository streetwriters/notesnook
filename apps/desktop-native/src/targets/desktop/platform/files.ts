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

import fs, { dialog } from "@react-native-gpui/fs";
import type { Files, PickedFile, WritableFile } from "../../../platform";

const MIME_TYPES: Record<string, string> = {
  json: "application/json",
  txt: "text/plain",
  md: "text/markdown",
  html: "text/html",
  zip: "application/zip",
  nnbackup: "application/octet-stream",
  nnbackupz: "application/octet-stream"
};

function nameOf(path: string) {
  return path.split(/[\\/]/).pop() ?? path;
}

export function toPickedFile(path: string, size: number): PickedFile {
  const name = nameOf(path);
  const extension = name.includes(".") ? name.split(".").pop()! : "";
  return {
    name,
    size,
    type: MIME_TYPES[extension.toLowerCase()] ?? "application/octet-stream",
    uri: `file://${path}`,
    text: () => fs.promises.readFile(path, "utf8") as Promise<string>,
    bytes: async () => new Uint8Array(await fs.promises.readFile(path))
  };
}

function parseAccept(accept: string) {
  const extensions = accept
    .split(",")
    .map((type) => type.trim())
    .filter((type) => type.startsWith("."))
    .map((type) => type.slice(1));
  return extensions.length > 0 ? [{ name: "Files", extensions }] : [];
}

async function open(path: string): Promise<WritableFile> {
  const handle = await fs.promises.open(path, "w");
  return {
    write: async (chunk) => {
      await handle.write(chunk);
    },
    close: () => handle.close(),
    abort: () => handle.close()
  };
}

export const files: Files = {
  async pick({ acceptedFileTypes, multiple }) {
    const selected = await dialog.open({
      multiple: !!multiple,
      filters: parseAccept(acceptedFileTypes)
    });
    return Promise.all(
      selected.map(async (path) =>
        toPickedFile(path, (await fs.promises.stat(path)).size)
      )
    );
  },
  async create(filename) {
    const path = await dialog.save({ defaultName: filename });
    if (!path) throw new Error("No file was selected");
    return open(path);
  },
  createAt: (path) => open(path)
};
