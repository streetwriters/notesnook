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

import { ISodium, base64_variants } from "@notesnook/sodium";
import KeyUtils from "./keyutils.js";
import { Chunk, Cipher, Input, DataFormat, SerializedKey } from "./types.js";

const encoder = new TextEncoder();
export default class Encryption {
  private static transformInput(
    sodium: ISodium,
    input: Input<DataFormat>,
    format: DataFormat
  ): Uint8Array {
    let data: Uint8Array | null = null;
    if (typeof input === "string" && format === "base64") {
      data = sodium.from_base64(input, base64_variants.ORIGINAL);
    } else if (typeof input === "string") {
      data = encoder.encode(input);
    } else if (input instanceof Uint8Array) {
      data = input;
    }
    if (!data) throw new Error("Data cannot be null.");
    return data;
  }

  static encrypt<TOutputFormat extends DataFormat>(
    sodium: ISodium,
    key: SerializedKey,
    input: Input<DataFormat>,
    format: DataFormat,
    outputFormat: TOutputFormat = "uint8array" as TOutputFormat
  ): Cipher<TOutputFormat> {
    const encryptionKey = KeyUtils.transform(sodium, key);
    const data = this.transformInput(sodium, input, format);

    const nonce = sodium.randombytes_buf(
      sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
    );

    const cipher: string | Uint8Array =
      sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
        data,
        null,
        null,
        nonce,
        encryptionKey.key
      );

    let output: string | Uint8Array = cipher;
    if (outputFormat === "base64") {
      output = sodium.to_base64(cipher, base64_variants.URLSAFE_NO_PADDING);
    }

    const iv = sodium.to_base64(nonce);
    return {
      format: outputFormat,
      alg: getAlgorithm(base64_variants.URLSAFE_NO_PADDING),
      cipher: output,
      iv,
      salt: encryptionKey.salt,
      length: data.length
    } as Cipher<TOutputFormat>;
  }

  static createStream(
    sodium: ISodium,
    key: SerializedKey
  ): {
    iv: string;
    stream: TransformStream<Chunk, Uint8Array>;
  } {
    const { key: _key } = KeyUtils.transform(sodium, key);
    const { state, header } =
      sodium.crypto_secretstream_xchacha20poly1305_init_push(_key, "base64");

    return {
      iv: header,
      stream: new TransformStream<Chunk, Uint8Array>({
        start() {},
        transform(chunk, controller) {
          controller.enqueue(
            sodium.crypto_secretstream_xchacha20poly1305_push(
              state,
              chunk.data,
              null,
              chunk.final
                ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
                : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
            )
          );
          if (chunk.final) controller.terminate();
        }
      })
    };
  }
}

function getAlgorithm(base64Variant: base64_variants) {
  //Template: encryptionAlgorithm-kdfAlgorithm-base64variant
  return `xcha-argon2i13-${base64Variant}`;
}
