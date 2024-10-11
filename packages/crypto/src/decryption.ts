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

import { base64_variants, ISodium } from "@notesnook/sodium";
import KeyUtils from "./keyutils.js";
import { Cipher, Output, DataFormat, SerializedKey } from "./types.js";

export default class Decryption {
  private static transformInput(
    sodium: ISodium,
    cipherData: Cipher<DataFormat>
  ): Uint8Array {
    let input: Uint8Array | null = null;
    if (
      typeof cipherData.cipher === "string" &&
      cipherData.format === "base64"
    ) {
      input = sodium.from_base64(
        cipherData.cipher,
        base64_variants.URLSAFE_NO_PADDING
      );
    } else if (
      typeof cipherData.cipher === "string" &&
      cipherData.format === "hex"
    ) {
      input = sodium.from_hex(cipherData.cipher);
    } else if (cipherData.cipher instanceof Uint8Array) {
      input = cipherData.cipher;
    }
    if (!input) throw new Error("Data cannot be null.");
    return input;
  }

  static decrypt<TOutputFormat extends DataFormat>(
    sodium: ISodium,
    key: SerializedKey,
    cipherData: Cipher<DataFormat>,
    outputFormat: TOutputFormat = "text" as TOutputFormat
  ): Output<TOutputFormat> {
    if (!key.salt && cipherData.salt) key.salt = cipherData.salt;
    const encryptionKey = KeyUtils.transform(sodium, key);

    const input = this.transformInput(sodium, cipherData);
    const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      input,
      null,
      sodium.from_base64(cipherData.iv),
      encryptionKey.key
    );

    return (
      outputFormat === "base64"
        ? sodium.to_base64(plaintext, base64_variants.ORIGINAL)
        : outputFormat === "text"
        ? sodium.to_string(plaintext)
        : plaintext
    ) as Output<TOutputFormat>;
  }

  static createStream(
    sodium: ISodium,
    header: string,
    key: SerializedKey
  ): TransformStream<Uint8Array, Uint8Array> {
    const { key: _key } = KeyUtils.transform(sodium, key);
    const state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
      sodium.from_base64(header),
      _key
    );

    return new TransformStream<Uint8Array, Uint8Array>({
      start() {},
      transform(chunk, controller) {
        const { message, tag } =
          sodium.crypto_secretstream_xchacha20poly1305_pull(state, chunk, null);
        if (!message) throw new Error("Could not decrypt chunk.");
        controller.enqueue(message);
        if (tag === sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL)
          controller.terminate();
      }
    });
  }
}
