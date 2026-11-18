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

import type { Files, PickedFile, WritableFile } from "../../../platform";

export function toPickedFile(file: File): PickedFile {
  return {
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    uri: URL.createObjectURL(file),
    text: () => file.text(),
    bytes: async () => new Uint8Array(await file.arrayBuffer())
  };
}

function download(filename: string): WritableFile {
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  return {
    async write(chunk) {
      chunks.push(chunk.slice() as Uint8Array<ArrayBuffer>);
    },
    async close() {
      const url = URL.createObjectURL(new Blob(chunks));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    },
    async abort() {
      chunks.length = 0;
    }
  };
}

export const files: Files = {
  pick({ acceptedFileTypes, multiple }) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = acceptedFileTypes;
      input.multiple = !!multiple;
      input.onchange = () => resolve(Array.from(input.files ?? []).map(toPickedFile));
      input.oncancel = () => resolve([]);
      input.click();
    });
  },
  async create(filename) {
    return download(filename);
  },
  async createAt(path) {
    return download(path.split(/[\\/]/).pop() || path);
  },
  async readBytes() {
    throw new Error("files.readBytes is not implemented on web");
  }
};
