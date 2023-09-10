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

import { initialize } from "@notesnook/sodium";
import Decryption from "./src/decryption";
import Encryption from "./src/encryption";
import { INNCrypto } from "./src/interfaces";
import KeyUtils from "./src/keyutils";
import Password from "./src/password";
import {
  Cipher,
  EncryptionKey,
  Input,
  Output,
  DataFormat,
  SerializedKey
} from "./src/types";

export class NNCrypto implements INNCrypto {
  private isReady = false;

  private async init() {
    if (this.isReady) return;
    await initialize();
    this.isReady = true;
  }

  async encrypt<TOutputFormat extends DataFormat>(
    key: SerializedKey,
    input: Input<DataFormat>,
    format: DataFormat,
    outputFormat: TOutputFormat = "uint8array" as TOutputFormat
  ): Promise<Cipher<TOutputFormat>> {
    await this.init();
    return Encryption.encrypt(
      key,
      input,
      format,
      outputFormat
    ) as Cipher<TOutputFormat>;
  }

  async encryptMulti<TOutputFormat extends DataFormat>(
    key: SerializedKey,
    items: Input<DataFormat>[],
    format: DataFormat,
    outputFormat = "uint8array" as TOutputFormat
  ): Promise<Cipher<TOutputFormat>[]> {
    await this.init();
    return items.map((data) =>
      Encryption.encrypt(key, data, format, outputFormat)
    );
  }

  async decrypt<TOutputFormat extends DataFormat>(
    key: SerializedKey,
    cipherData: Cipher<DataFormat>,
    outputFormat: TOutputFormat = "text" as TOutputFormat
  ): Promise<Output<TOutputFormat>> {
    await this.init();
    return Decryption.decrypt(key, cipherData, outputFormat);
  }

  async decryptMulti<TOutputFormat extends DataFormat>(
    key: SerializedKey,
    items: Cipher<DataFormat>[],
    outputFormat: TOutputFormat = "text" as TOutputFormat
  ): Promise<Output<TOutputFormat>[]> {
    await this.init();
    const decryptedItems: Output<TOutputFormat>[] = [];
    for (const cipherData of items) {
      decryptedItems.push(Decryption.decrypt(key, cipherData, outputFormat));
    }
    return decryptedItems;
  }

  async hash(password: string, salt: string): Promise<string> {
    await this.init();
    return Password.hash(password, salt);
  }

  async deriveKey(password: string, salt?: string): Promise<EncryptionKey> {
    await this.init();
    return KeyUtils.deriveKey(password, salt);
  }

  async exportKey(password: string, salt?: string): Promise<SerializedKey> {
    await this.init();
    return KeyUtils.exportKey(password, salt);
  }

  async createEncryptionStream(key: SerializedKey) {
    await this.init();
    return Encryption.createStream(key);

    // // eslint-disable-next-line no-constant-condition
    // while (true) {
    //   const chunk = await stream.read();
    //   if (!chunk) break;

    //   const { data, final } = chunk;
    //   if (!data) break;

    //   const encryptedChunk: Chunk = {
    //     data: encryptionStream.write(data, final),
    //     final
    //   };
    //   await stream.write(encryptedChunk);

    //   if (final) break;
    // }
    // return encryptionStream.header;
  }

  async createDecryptionStream(key: SerializedKey, iv: string) {
    await this.init();
    return Decryption.createStream(iv, key);
    // eslint-disable-next-line no-constant-condition
    // while (true) {
    //   const chunk = await stream.read();
    //   if (!chunk) break;

    //   const { data, final } = chunk;
    //   if (!data) break;

    //   const decryptedChunk: Chunk = {
    //     data: decryptionStream.read(data),
    //     final
    //   };
    //   await stream.write(decryptedChunk);

    //   if (final) break;
    // }
  }

  // async encryptStream(
  //   key: SerializedKey,
  //   stream: IStreamable,
  //   _streamId?: string
  // ): Promise<string> {
  //   await this.init();
  //   return await this.createEncryptionStream(key, stream);
  // }

  // async decryptStream(
  //   key: SerializedKey,
  //   iv: string,
  //   stream: IStreamable,
  //   _streamId?: string
  // ): Promise<void> {
  //   await this.init();
  //   await this.createDecryptionStream(iv, key, stream);
  // }
}

export * from "./src/types";
export * from "./src/interfaces";
export { Decryption };
