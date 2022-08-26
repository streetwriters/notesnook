import { File } from "./types";
import { Chunk } from "@notesnook/crypto/dist/src/types";

export default class FileStreamSource implements UnderlyingSource<Chunk> {
  private storage: LocalForage;
  private file: File;
  private offset: number = 0;

  constructor(storage: LocalForage, file: File) {
    this.storage = storage;
    this.file = file;
  }

  start(controller: ReadableStreamController<Chunk>) {}

  async pull(controller: ReadableStreamController<Chunk>) {
    const data = await this.readChunk(this.offset++);
    const isFinalChunk = this.offset === this.file.chunks;

    if (data)
      controller.enqueue({
        data,
        final: isFinalChunk
      });

    if (isFinalChunk || !data) controller.close();
  }

  private readChunk(offset: number) {
    if (offset > this.file.chunks) return;
    return this.storage.getItem<Uint8Array>(this.getChunkKey(offset));
  }

  private getChunkKey(offset: number): string {
    return `${this.file.filename}-chunk-${offset}`;
  }
}
