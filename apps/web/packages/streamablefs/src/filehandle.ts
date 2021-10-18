import FileStreamSource from "./filestreamsource";
import { File } from "./types";

export default class FileHandle extends ReadableStream {
  private storage: LocalForage;
  private file: File;

  constructor(storage: LocalForage, file: File) {
    super(new FileStreamSource(storage, file));

    this.file = file;
    this.storage = storage;
  }

  /**
   *
   * @param {Uint8Array} chunk
   */
  async write(chunk: Uint8Array) {
    await this.storage.setItem(this.getChunkKey(this.file.chunks++), chunk);
    await this.storage.setItem(this.file.filename, this.file);
  }

  async addAdditionalData(key: string, value: any) {
    this.file.additionalData = this.file.additionalData || {};
    this.file.additionalData[key] = value;
    await this.storage.setItem(this.file.filename, this.file);
  }

  async delete() {
    for (let i = 0; i < this.file.chunks; ++i) {
      await this.storage.removeItem(this.getChunkKey(i));
    }
    await this.storage.removeItem(this.file.filename);
  }

  private getChunkKey(offset: number): string {
    return `${this.file.filename}-chunk-${offset}`;
  }

  async readChunk(offset: number): Promise<Uint8Array | null> {
    const array = await this.storage.getItem<Uint8Array>(
      this.getChunkKey(offset)
    );
    return array;
  }

  async readChunks(from: number, length: number): Promise<Blob> {
    let blobParts: BlobPart[] = [];
    for (let i = from; i < from + length; ++i) {
      const array = await this.readChunk(i);
      if (!array) continue;
      blobParts.push(array.buffer);
    }
    return new Blob(blobParts, { type: this.file.type });
  }

  async toBlob() {
    let blobParts: BlobPart[] = [];
    for (let i = 0; i < this.file.chunks; ++i) {
      const array = await this.readChunk(i);
      if (!array) continue;
      blobParts.push(array.buffer);
    }
    return new Blob(blobParts, { type: this.file.type });
  }
}
