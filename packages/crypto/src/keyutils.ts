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

import { ISodium } from "@notesnook/sodium";
import { EncryptionKey, SerializedKey } from "./types.js";

export default class KeyUtils {
  static deriveKey(
    sodium: ISodium,
    password: string,
    salt?: string
  ): EncryptionKey {
    let saltBytes: Uint8Array;
    if (!salt)
      saltBytes = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
    else {
      saltBytes = sodium.from_base64(salt);
    }

    if (!saltBytes)
      throw new Error("Could not generate bytes from the given salt.");

    const key = sodium.crypto_pwhash(
      sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
      password,
      saltBytes,
      3, // operations limit
      1024 * 1024 * 8, // memory limit (8MB)
      sodium.crypto_pwhash_ALG_ARGON2I13
    );

    return {
      key,
      salt: typeof salt === "string" ? salt : sodium.to_base64(saltBytes)
    };
  }

  static exportKey(
    sodium: ISodium,
    password: string,
    salt?: string
  ): SerializedKey {
    const { key, salt: keySalt } = this.deriveKey(sodium, password, salt);
    return { key: sodium.to_base64(key), salt: keySalt };
  }

  /**
   * Takes in either a password or a serialized encryption key
   * and spits out a key that can be directly used for encryption/decryption.
   * @param input
   */
  static transform(sodium: ISodium, input: SerializedKey): EncryptionKey {
    if ("password" in input && !!input.password) {
      const { password, salt } = input;
      return this.deriveKey(sodium, password, salt);
    } else if ("key" in input && !!input.salt && !!input.key) {
      return { key: sodium.from_base64(input.key), salt: input.salt };
    }
    throw new Error("Invalid input.");
  }
}
