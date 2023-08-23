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

import {
  SerializedKey,
  Plaintext,
  OutputFormat,
  Cipher,
  EncryptionKey,
  INNCrypto,
  Output
} from "@notesnook/crypto";
import { NNCryptoWorkerModule } from "./src/worker";
import { wrap } from "comlink";

export class NNCryptoWorker implements INNCrypto {
  private workermodule?: NNCryptoWorkerModule;
  private isReady = false;

  constructor(private readonly worker?: Worker) {}

  private async init() {
    if (!this.worker) throw new Error("worker cannot be undefined.");
    if (this.isReady) return;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.workermodule = wrap<NNCryptoWorkerModule>(this.worker);
    // this.workermodule = await spawn<NNCryptoWorkerModule>(this.worker);
    this.isReady = true;
  }

  async encrypt(
    key: SerializedKey,
    plaintext: Plaintext<OutputFormat>,
    outputFormat: OutputFormat = "uint8array"
  ): Promise<Cipher> {
    await this.init();
    if (!this.workermodule) throw new Error("Worker module is not ready.");

    return this.workermodule.encrypt(key, plaintext, outputFormat);
  }

  async decrypt<TOutputFormat extends OutputFormat>(
    key: SerializedKey,
    cipherData: Cipher,
    outputFormat: TOutputFormat = "text" as TOutputFormat
  ): Promise<Output<TOutputFormat>> {
    await this.init();
    if (!this.workermodule) throw new Error("Worker module is not ready.");

    return this.workermodule.decrypt(key, cipherData, outputFormat);
  }

  async decryptMulti<TOutputFormat extends OutputFormat>(
    key: SerializedKey,
    items: Cipher[],
    outputFormat: TOutputFormat = "text" as TOutputFormat
  ): Promise<Output<TOutputFormat>[]> {
    await this.init();
    if (!this.workermodule) throw new Error("Worker module is not ready.");

    return this.workermodule.decryptMulti(key, items, outputFormat);
  }

  async hash(password: string, salt: string): Promise<string> {
    await this.init();
    if (!this.workermodule) throw new Error("Worker module is not ready.");

    return this.workermodule.hash(password, salt);
  }

  async deriveKey(password: string, salt?: string): Promise<EncryptionKey> {
    await this.init();
    if (!this.workermodule) throw new Error("Worker module is not ready.");

    return this.workermodule.deriveKey(password, salt);
  }

  async exportKey(password: string, salt?: string): Promise<SerializedKey> {
    await this.init();
    if (!this.workermodule) throw new Error("Worker module is not ready.");

    return this.workermodule.exportKey(password, salt);
  }

  async createEncryptionStream(key: SerializedKey) {
    await this.init();
    if (!this.workermodule) throw new Error("Worker module is not ready.");
    return this.workermodule.createEncryptionStream(key);
  }

  async createDecryptionStream(key: SerializedKey, iv: string) {
    await this.init();
    if (!this.workermodule) throw new Error("Worker module is not ready.");
    const { stream } = await this.workermodule.createDecryptionStream(key, iv);
    return stream;
  }
  // async encryptStream(
  //   key: SerializedKey,
  //   stream: IStreamable,
  //   streamId?: string
  // ): Promise<string> {
  //   if (!streamId) throw new Error("streamId is required.");
  //   await this.init();
  //   if (!this.workermodule) throw new Error("Worker module is not ready.");
  //   if (!this.worker) throw new Error("Worker is not ready.");

  //   const eventListener = await this.createWorkerStream(
  //     streamId,
  //     stream,
  //     () => {
  //       if (this.worker)
  //         this.worker.removeEventListener("message", eventListener);
  //     }
  //   );
  //   this.worker.addEventListener("message", eventListener);
  //   const iv = await this.workermodule.createEncryptionStream(streamId, key);
  //   this.worker.removeEventListener("message", eventListener);
  //   return iv;
  // }

  // async decryptStream(
  //   key: SerializedKey,
  //   iv: string,
  //   stream: IStreamable,
  //   streamId?: string
  // ): Promise<void> {
  //   if (!streamId) throw new Error("streamId is required.");
  //   await this.init();
  //   if (!this.workermodule) throw new Error("Worker module is not ready.");
  //   if (!this.worker) throw new Error("Worker is not ready.");

  //   const eventListener = await this.createWorkerStream(
  //     streamId,
  //     stream,
  //     () => {
  //       if (this.worker)
  //         this.worker.removeEventListener("message", eventListener);
  //     }
  //   );
  //   this.worker.addEventListener("message", eventListener);
  //   await this.workermodule.createDecryptionStream(streamId, iv, key);
  //   this.worker.removeEventListener("message", eventListener);
  // }

  // private async createWorkerStream(
  //   streamId: string,
  //   stream: IStreamable,
  //   done: () => void
  // ): Promise<EventListenerObject> {
  //   const readEventType = `${streamId}:read`;
  //   const writeEventType = `${streamId}:write`;
  //   let finished = false;
  //   return {
  //     handleEvent: async (ev: MessageEvent) => {
  //       if (finished) return;

  //       const { type } = ev.data;
  //       if (type === readEventType) {
  //         const chunk = await stream.read();
  //         if (!chunk || !this.worker || !chunk.data) return;
  //         this.worker.postMessage({ type, data: chunk }, [chunk.data.buffer]);
  //       } else if (type === writeEventType) {
  //         const chunk = ev.data.data as Chunk;
  //         await stream.write(chunk);
  //         if (chunk.final) {
  //           finished = true;
  //           done();
  //         }
  //       }
  //     }
  //   };
  // }
}
