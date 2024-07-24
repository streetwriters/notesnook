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
import OriginPrivateFileStoreWorker from "./opfs.worker?worker";
import { OriginPrivateFileStoreWorkerType } from "./opfs.worker";
import { transfer, wrap } from "comlink";

export class IndexedDBFileStore implements IFileStorage {
  storage: IndexedDBKVStore;
  constructor(name: string) {
    this.storage = new IndexedDBKVStore(name, name);
  }

  clear(): Promise<void> {
    return this.storage.clear();
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
  writeChunk(chunkName: string, data: Uint8Array): Promise<void> {
    return this.storage.set(chunkName, data);
  }
  deleteChunk(chunkName: string): Promise<void> {
    return this.storage.delete(chunkName);
  }
  readChunk(chunkName: string): Promise<Uint8Array | undefined> {
    return this.storage.get(chunkName);
  }
  async listChunks(chunkPrefix: string): Promise<string[]> {
    const keys = await this.storage.keys();
    return keys.filter((k) =>
      (k as string).startsWith(chunkPrefix)
    ) as string[];
  }
}

export class CacheStorageFileStore implements IFileStorage {
  storage: IndexedDBKVStore;
  constructor(private readonly name: string) {
    this.storage = new IndexedDBKVStore(name, name);
    console.log("USING CACHE FILE STORE!");
  }

  private getCache() {
    return window.caches.open(this.name);
  }

  async clear(): Promise<void> {
    const cache = await this.getCache();
    for (const req of await cache.keys()) {
      await cache.delete(req);
    }
    return this.storage.clear();
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
    const cache = await this.getCache();
    await cache.put(
      this.toURL(chunkName),
      new Response(data, {
        headers: new Headers({
          "Content-Length": data.length.toString(),
          "Content-Type": "application/encrypted-octet-stream"
        })
      })
    );
  }

  async deleteChunk(chunkName: string): Promise<void> {
    const cache = await this.getCache();
    await cache.delete(this.toURL(chunkName));
  }

  async readChunk(chunkName: string): Promise<Uint8Array | undefined> {
    const cache = await this.getCache();
    const response = await cache.match(this.toURL(chunkName));
    return response ? new Uint8Array(await response.arrayBuffer()) : undefined;
  }

  async listChunks(chunkPrefix: string): Promise<string[]> {
    const cache = await this.getCache();
    const keys = await cache.keys();
    return keys
      .filter((k) => k.url.startsWith(`/${chunkPrefix}`))
      .map((r) => r.url.slice(1));
  }

  private toURL(chunkName: string) {
    return `/${chunkName}`;
  }
}

export class OriginPrivateFileSystem implements IFileStorage {
  private readonly worker = wrap<OriginPrivateFileStoreWorkerType>(
    new OriginPrivateFileStoreWorker()
  );
  private created = false;
  constructor(private readonly name: string) {
    console.log("using origin private file store");
  }
  private async create() {
    if (this.created) return;
    await this.worker.create(this.name, this.name);
    this.created = true;
  }
  async clear(): Promise<void> {
    await this.create();
    await this.worker.clear(this.name);
  }
  async setMetadata(filename: string, metadata: File): Promise<void> {
    await this.create();
    await this.worker.setMetadata(this.name, filename, metadata);
  }
  async getMetadata(filename: string): Promise<File | undefined> {
    await this.create();
    return this.worker.getMetadata(this.name, filename);
  }
  async deleteMetadata(filename: string): Promise<void> {
    await this.create();
    return this.worker.deleteMetadata(this.name, filename);
  }
  async writeChunk(chunkName: string, data: Uint8Array): Promise<void> {
    await this.create();
    return this.worker.writeChunk(
      this.name,
      chunkName,
      transfer(data.buffer, [data.buffer])
    );
  }
  async deleteChunk(chunkName: string): Promise<void> {
    await this.create();
    return this.worker.deleteChunk(this.name, chunkName);
  }
  async readChunk(chunkName: string): Promise<Uint8Array | undefined> {
    await this.create();
    return this.worker.readChunk(this.name, chunkName);
  }
  async listChunks(chunkPrefix: string): Promise<string[]> {
    await this.create();
    return (await this.worker.listChunks(this.name, chunkPrefix)) || [];
  }
}
