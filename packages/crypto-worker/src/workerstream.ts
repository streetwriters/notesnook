import { IStreamable } from "@notesnook/crypto/dist/src/interfaces";
import { Chunk } from "@notesnook/crypto/dist/src/types";
import { sendEventWithResult } from "./utils";

export default class WorkerStream
  extends ReadableStream<Chunk>
  implements IStreamable
{
  private id: string;
  private reader?: ReadableStreamReader<Chunk>;

  constructor(streamId: string) {
    super(new WorkerStreamSource(streamId));
    this.id = streamId;
  }

  async read(): Promise<Chunk | undefined> {
    if (!this.reader) this.reader = this.getReader();
    const { value } = await this.reader.read();
    return value;
  }

  /**
   * @param {Uint8Array} chunk
   */
  async write(chunk: Chunk): Promise<void> {
    if (!chunk.data) return;
    postMessage({ type: `${this.id}:write`, data: chunk }, [chunk.data.buffer]);
  }
}

class WorkerStreamSource implements UnderlyingSource<Chunk> {
  private id: string;
  constructor(streamId: string) {
    this.id = streamId;
  }

  start() {}

  async pull(controller: ReadableStreamController<Chunk>) {
    const chunk = await sendEventWithResult<Chunk>(`${this.id}:read`);
    controller.enqueue(chunk);
    if (chunk.final) controller.close();
  }
}
