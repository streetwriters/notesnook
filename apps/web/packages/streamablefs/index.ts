import localforage from "localforage";
import FileHandle from "./src/filehandle";
import { IStreamableFS } from "./src/interfaces";
import { File } from "./src/types";

export class StreamableFS implements IStreamableFS {
  private storage: LocalForage;

  /**
   * @param db name of the indexeddb database
   */
  constructor(db: string) {
    this.storage = localforage.createInstance({
      storeName: "streamable-fs",
      name: db,
      driver: [localforage.INDEXEDDB],
    });
  }

  async createFile(
    filename: string,
    size: number,
    type: string
  ): Promise<FileHandle> {
    if (await this.exists(filename)) throw new Error("File already exists.");

    const file: File = await this.storage.setItem<File>(filename, {
      filename,
      size,
      type,
      chunks: 0,
    });
    return new FileHandle(this.storage, file);
  }

  async readFile(filename: string): Promise<FileHandle> {
    const file = await this.storage.getItem<File>(filename);
    if (!file) throw new Error("File does not exist.");
    return new FileHandle(this.storage, file);
  }

  async exists(filename: string): Promise<boolean> {
    const file = await this.storage.getItem<File>(filename);
    return !!file;
  }

  async deleteFile(filename: string) {
    const handle = await this.readFile(filename);
    if (!handle) return;
    await handle.delete();
  }
}
