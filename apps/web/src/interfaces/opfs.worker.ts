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
  constructor(
    name: string,
    private readonly directory: FileSystemDirectoryHandle
  ) {
    this.storage = new IndexedDBKVStore(name, name);
  }

  async clear(): Promise<void> {
    for await (const [name] of this.directory) {
      await this.directory.removeEntry(name, { recursive: true });
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
    const file = await this.directory.getFileHandle(chunkName, {
      create: true
    });
    const syncHandle = await file.createSyncAccessHandle();
    syncHandle.write(data);
    syncHandle.close();
  }
  async deleteChunk(chunkName: string) {
    try {
      await this.directory.removeEntry(chunkName);
    } catch (e) {
      console.error("Failed to delete chunk", e);
    }
  }
  async readChunk(chunkName: string): Promise<Uint8Array | undefined> {
    try {
      const file = await this.directory.getFileHandle(chunkName);
      const syncHandle = await file.createSyncAccessHandle();
      const buffer = new Uint8Array(syncHandle.getSize());
      syncHandle.read(buffer);
      syncHandle.close();
      return buffer;
    } catch (e) {
      console.error("Failed to read chunk", e);
      return;
    }
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
  }
};

expose(workerModule);

export type OriginPrivateFileStoreWorkerType = typeof workerModule;
