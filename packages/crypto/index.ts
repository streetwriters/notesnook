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

import { ready } from "libsodium-wrappers";
import Decryption from "./src/decryption";
import Encryption from "./src/encryption";
import { INNCrypto, IStreamable } from "./src/interfaces";
import KeyUtils from "./src/keyutils";
import Password from "./src/password";
import {
  Cipher,
  EncryptionKey,
  OutputFormat,
  Plaintext,
  SerializedKey,
  Chunk
} from "./src/types";

export class NNCrypto implements INNCrypto {
  private isReady = false;

  private async init() {
    if (this.isReady) return;
    await ready;
    this.isReady = true;
  }

  async encrypt(
    key: SerializedKey,
    plaintext: Plaintext,
    outputFormat: OutputFormat = "uint8array"
  ): Promise<Cipher> {
    await this.init();
    return Encryption.encrypt(key, plaintext, outputFormat);
  }

  async decrypt(
    key: SerializedKey,
    cipherData: Cipher,
    outputFormat: OutputFormat = "text"
  ): Promise<Plaintext> {
    await this.init();
    return Decryption.decrypt(key, cipherData, outputFormat);
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

  async createEncryptionStream(
    key: SerializedKey,
    stream: IStreamable
  ): Promise<string> {
    await this.init();
    const encryptionStream = Encryption.createStream(key);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const chunk = await stream.read();
      if (!chunk) break;

      const { data, final } = chunk;
      if (!data) break;

      const encryptedChunk: Chunk = {
        data: encryptionStream.write(data, final),
        final
      };
      await stream.write(encryptedChunk);

      if (final) break;
    }
    return encryptionStream.header;
  }

  async createDecryptionStream(
    iv: string,
    key: SerializedKey,
    stream: IStreamable
  ) {
    await this.init();
    const decryptionStream = Decryption.createStream(iv, key);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const chunk = await stream.read();
      if (!chunk) break;

      const { data, final } = chunk;
      if (!data) break;

      const decryptedChunk: Chunk = {
        data: decryptionStream.read(data),
        final
      };
      await stream.write(decryptedChunk);

      if (final) break;
    }
  }

  async encryptStream(
    key: SerializedKey,
    stream: IStreamable,
    _streamId?: string
  ): Promise<string> {
    await this.init();
    return await this.createEncryptionStream(key, stream);
  }

  async decryptStream(
    key: SerializedKey,
    iv: string,
    stream: IStreamable,
    _streamId?: string
  ): Promise<void> {
    await this.init();
    await this.createDecryptionStream(iv, key, stream);
  }
}
