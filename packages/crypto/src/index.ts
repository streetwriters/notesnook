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

import { ISodium, Sodium } from "@notesnook/sodium";
import Decryption from "./decryption.js";
import Encryption from "./encryption.js";
import { INNCrypto } from "./interfaces.js";
import KeyUtils from "./keyutils.js";
import Password from "./password.js";
import {
  Cipher,
  EncryptionKey,
  Input,
  Output,
  DataFormat,
  SerializedKey
} from "./types.js";

export class NNCrypto implements INNCrypto {
  private isReady = false;
  private sodium: ISodium = new Sodium();

  private async init() {
    if (this.isReady) return;
    await this.sodium.initialize();
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
      this.sodium,
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
      Encryption.encrypt(this.sodium, key, data, format, outputFormat)
    );
  }

  async decrypt<TOutputFormat extends DataFormat>(
    key: SerializedKey,
    cipherData: Cipher<DataFormat>,
    outputFormat: TOutputFormat = "text" as TOutputFormat
  ): Promise<Output<TOutputFormat>> {
    await this.init();
    return Decryption.decrypt(this.sodium, key, cipherData, outputFormat);
  }

  async decryptMulti<TOutputFormat extends DataFormat>(
    key: SerializedKey,
    items: Cipher<DataFormat>[],
    outputFormat: TOutputFormat = "text" as TOutputFormat
  ): Promise<Output<TOutputFormat>[]> {
    await this.init();
    const decryptedItems: Output<TOutputFormat>[] = [];
    for (const cipherData of items) {
      decryptedItems.push(
        Decryption.decrypt(this.sodium, key, cipherData, outputFormat)
      );
    }
    return decryptedItems;
  }

  async hash(password: string, salt: string): Promise<string> {
    await this.init();
    return Password.hash(this.sodium, password, salt);
  }

  async deriveKey(password: string, salt?: string): Promise<EncryptionKey> {
    await this.init();
    return KeyUtils.deriveKey(this.sodium, password, salt);
  }

  async exportKey(password: string, salt?: string): Promise<SerializedKey> {
    await this.init();
    return KeyUtils.exportKey(this.sodium, password, salt);
  }

  async createEncryptionStream(key: SerializedKey) {
    await this.init();
    return Encryption.createStream(this.sodium, key);
  }

  async createDecryptionStream(key: SerializedKey, iv: string) {
    await this.init();
    return Decryption.createStream(this.sodium, iv, key);
  }
}

export * from "./types.js";
export * from "./interfaces.js";
export { Decryption };
