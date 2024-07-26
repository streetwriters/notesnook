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
  crypto_aead_xchacha20poly1305_ietf_decrypt,
  crypto_secretstream_xchacha20poly1305_init_pull,
  crypto_secretstream_xchacha20poly1305_pull,
  to_base64,
  from_base64,
  base64_variants,
  to_string,
  crypto_secretstream_xchacha20poly1305_TAG_FINAL,
  from_hex
} from "@notesnook/sodium";
import KeyUtils from "./keyutils";
import { Cipher, Output, DataFormat, SerializedKey } from "./types";

export default class Decryption {
  private static transformInput(cipherData: Cipher<DataFormat>): Uint8Array {
    let input: Uint8Array | null = null;
    if (
      typeof cipherData.cipher === "string" &&
      cipherData.format === "base64"
    ) {
      input = from_base64(
        cipherData.cipher,
        base64_variants.URLSAFE_NO_PADDING
      );
    } else if (
      typeof cipherData.cipher === "string" &&
      cipherData.format === "hex"
    ) {
      input = from_hex(cipherData.cipher);
    } else if (cipherData.cipher instanceof Uint8Array) {
      input = cipherData.cipher;
    }
    if (!input) throw new Error("Data cannot be null.");
    return input;
  }

  static decrypt<TOutputFormat extends DataFormat>(
    key: SerializedKey,
    cipherData: Cipher<DataFormat>,
    outputFormat: TOutputFormat = "text" as TOutputFormat
  ): Output<TOutputFormat> {
    if (!key.salt && cipherData.salt) key.salt = cipherData.salt;
    const encryptionKey = KeyUtils.transform(key);

    const input = this.transformInput(cipherData);
    const plaintext = crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      input,
      null,
      from_base64(cipherData.iv),
      encryptionKey.key
    );

    return (
      outputFormat === "base64"
        ? to_base64(plaintext, base64_variants.ORIGINAL)
        : outputFormat === "text"
        ? to_string(plaintext)
        : plaintext
    ) as Output<TOutputFormat>;
  }

  static createStream(
    header: string,
    key: SerializedKey
  ): TransformStream<Uint8Array, Uint8Array> {
    const { key: _key } = KeyUtils.transform(key);
    const state = crypto_secretstream_xchacha20poly1305_init_pull(
      from_base64(header),
      _key
    );

    return new TransformStream<Uint8Array, Uint8Array>({
      start() {},
      transform(chunk, controller) {
        const { message, tag } = crypto_secretstream_xchacha20poly1305_pull(
          state,
          chunk,
          null
        );
        if (!message) throw new Error("Could not decrypt chunk.");
        controller.enqueue(message);
        if (tag === crypto_secretstream_xchacha20poly1305_TAG_FINAL)
          controller.terminate();
      }
    });
  }
}
