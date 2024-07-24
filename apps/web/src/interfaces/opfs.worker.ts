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

import { IFileStorage } from "@notesnook/streamable-fs/dist/src/interfaces";
import { File } from "@notesnook/streamable-fs/dist/src/types";
import { IndexedDBKVStore } from "./key-value";
import { expose, transfer } from "comlink";

class OriginPrivateFileStore implements IFileStorage {
  private storage: IndexedDBKVStore;
  private locks: Map<string, Promise<any>> = new Map();
  constructor(
    name: string,
    private readonly directory: FileSystemDirectoryHandle
  ) {
    this.storage = new IndexedDBKVStore(name, name);
  }

  async clear(): Promise<void> {
    for await (const [name] of this.directory) {
      await this.safeOp(name, () =>
        this.directory.removeEntry(name, { recursive: true })
      );
    }
    await this.storage.clear();
  }
  setMetadata(filename: string, metadata: File): Promise<void> {
    return this.storage.set(filename, metadata);
  }
  getMetadata(filename: string): Promise<File | undefined> {
    return this.storage.get(filename);
  }
  deleteMetadata(filename: string): Promise<void> {
    return this.storage.delete(filename);
  }
  async writeChunk(chunkName: string, data: Uint8Array): Promise<void> {
    try {
      await this.safeOp(chunkName, () =>
        this.directory
          .getFileHandle(chunkName, {
            create: true
          })
          .then((file) => file.createSyncAccessHandle())
          .then((handle) => {
            handle.write(data);
            handle.close();
          })
      );
    } catch (e) {
      console.error("Failed to write chunk", e);
    }
  }

  async deleteChunk(chunkName: string) {
    try {
      await this.safeOp(chunkName, () => this.directory.removeEntry(chunkName));
    } catch (e) {
      console.error("Failed to delete chunk", e);
    }
  }

  async readChunk(chunkName: string): Promise<Uint8Array | undefined> {
    try {
      if (Object.hasOwn(FileSystemSyncAccessHandle.prototype, "mode")) {
        return readFile(this.directory, chunkName);
      }

      // OPFS currently does not support multiple readers on a single file
      // on all browsers so we wait for the file handle to be released before
      // continuing. This is temporary until all browsers start supporting
      // the read-only mode.
      return await this.safeOp(chunkName, () =>
        readFile(this.directory, chunkName)
      );
    } catch (e) {
      console.error("Failed to read chunk", e);
    }
  }

  async listChunks(chunkPrefix: string): Promise<string[]> {
    const chunks: string[] = [];
    for await (const entry of this.directory.keys()) {
      if (entry.startsWith(chunkPrefix)) chunks.push(entry);
    }
    return chunks;
  }

  private async safeOp<T>(chunkName: string, createPromise: () => Promise<T>) {
    const lock = this.locks.get(chunkName);
    if (lock) await lock;

    const promise = createPromise();
    this.locks.set(chunkName, promise);

    return await promise.finally(() => this.locks.delete(chunkName));
  }
}

const fileStores: Map<string, OriginPrivateFileStore> = new Map();
const workerModule = {
  async create(name: string, directoryName: string) {
    const root = await navigator.storage.getDirectory();
    const directoryHandle = await root.getDirectoryHandle(directoryName, {
      create: true
    });
    fileStores.set(
      directoryName,
      new OriginPrivateFileStore(name, directoryHandle)
    );
  },
  clear(directoryName: string) {
    return fileStores.get(directoryName)?.clear();
  },
  setMetadata(directoryName: string, filename: string, metadata: File) {
    return fileStores.get(directoryName)?.setMetadata(filename, metadata);
  },
  getMetadata(directoryName: string, filename: string) {
    return fileStores.get(directoryName)?.getMetadata(filename);
  },
  deleteMetadata(directoryName: string, filename: string) {
    return fileStores.get(directoryName)?.deleteMetadata(filename);
  },
  writeChunk(directoryName: string, chunkName: string, data: ArrayBuffer) {
    return fileStores
      .get(directoryName)
      ?.writeChunk(chunkName, new Uint8Array(data));
  },
  deleteChunk(directoryName: string, chunkName: string) {
    return fileStores.get(directoryName)?.deleteChunk(chunkName);
  },
  async readChunk(directoryName: string, chunkName: string) {
    const chunk = await fileStores.get(directoryName)?.readChunk(chunkName);
    return chunk ? transfer(chunk, [chunk.buffer]) : undefined;
  },
  async listChunks(directoryName: string, chunkPrefix: string) {
    return (await fileStores.get(directoryName)?.listChunks(chunkPrefix)) || [];
  }
};

expose(workerModule);

export type OriginPrivateFileStoreWorkerType = typeof workerModule;

async function readFile(directory: FileSystemDirectoryHandle, name: string) {
  const file = await directory.getFileHandle(name);
  const handle = await file.createSyncAccessHandle({ mode: "read-only" });
  const buffer = new Uint8Array(handle.getSize());
  handle.read(buffer);
  handle.close();
  return buffer;
}
