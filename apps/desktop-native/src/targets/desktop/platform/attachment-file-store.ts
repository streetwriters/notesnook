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

import type {
  File as StreamableFile,
  IFileStorage
} from "@notesnook/streamable-fs";

export interface FileStoreFs {
  mkdir(path: string, options: { recursive: boolean }): Promise<unknown>;
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<{ size: number }>;
  rm(
    path: string,
    options: { recursive: boolean; force: boolean }
  ): Promise<void>;
}

const META_EXTENSION = ".meta.json";

function isMissing(error: unknown) {
  const code = (error as { code?: string } | undefined)?.code;
  return code === "ENOENT" || code === "NotFound";
}

export function encodeName(name: string) {
  return encodeURIComponent(name).replace(/\*/g, "%2A");
}

export function decodeName(name: string) {
  return decodeURIComponent(name);
}

export function createFileStore(fs: FileStoreFs, root: string): IFileStorage {
  const metaDir = `${root}/meta`;
  const chunkDir = `${root}/chunks`;
  let ready: Promise<unknown> | undefined;

  function init() {
    if (!ready)
      ready = Promise.all([
        fs.mkdir(metaDir, { recursive: true }),
        fs.mkdir(chunkDir, { recursive: true })
      ]).catch((e) => {
        ready = undefined;
        throw e;
      });
    return ready;
  }

  async function list(dir: string) {
    await init();
    try {
      return await fs.readdir(dir);
    } catch (e) {
      if (isMissing(e)) return [];
      throw e;
    }
  }

  async function remove(path: string) {
    await fs.rm(path, { recursive: false, force: true });
  }

  const metaPath = (name: string) =>
    `${metaDir}/${encodeName(name)}${META_EXTENSION}`;
  const chunkPath = (name: string) => `${chunkDir}/${encodeName(name)}`;

  return {
    async clear() {
      await fs.rm(root, { recursive: true, force: true });
      ready = undefined;
      await init();
    },
    async setMetadata(filename, metadata) {
      await init();
      await fs.writeFile(
        metaPath(filename),
        new TextEncoder().encode(JSON.stringify(metadata))
      );
    },
    async getMetadata(filename) {
      await init();
      try {
        const bytes = await fs.readFile(metaPath(filename));
        return JSON.parse(new TextDecoder().decode(bytes)) as StreamableFile;
      } catch (e) {
        if (isMissing(e)) return undefined;
        throw e;
      }
    },
    async deleteMetadata(filename) {
      await init();
      await remove(metaPath(filename));
    },
    async writeChunk(chunkName, data) {
      await init();
      await fs.writeFile(chunkPath(chunkName), data);
    },
    async deleteChunk(chunkName) {
      await init();
      await remove(chunkPath(chunkName));
    },
    async readChunk(chunkName) {
      await init();
      try {
        return await fs.readFile(chunkPath(chunkName));
      } catch (e) {
        if (isMissing(e)) return undefined;
        throw e;
      }
    },
    async chunkSize(chunkName) {
      await init();
      try {
        return (await fs.stat(chunkPath(chunkName))).size;
      } catch (e) {
        if (isMissing(e)) return 0;
        throw e;
      }
    },
    async listChunks(prefix) {
      const names = await list(chunkDir);
      return names.map(decodeName).filter((name) => name.startsWith(prefix));
    },
    async list() {
      const chunks = (await list(chunkDir)).map(decodeName);
      const metas = (await list(metaDir))
        .filter((name) => name.endsWith(META_EXTENSION))
        .map((name) => decodeName(name.slice(0, -META_EXTENSION.length)));
      return [...metas, ...chunks];
    }
  };
}
