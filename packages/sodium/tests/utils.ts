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
// import * as browser from "../src/browser.js";
// import * as node from "../src/node.js";

import { ISodium } from "../src/types";

export async function streamingEncrypt(crypto: ISodium, key: Uint8Array) {
  await crypto.initialize();
  const { state, header } =
    crypto.crypto_secretstream_xchacha20poly1305_init_push(key, "base64");

  return {
    header,
    chunks: [
      crypto.crypto_secretstream_xchacha20poly1305_push(
        state,
        "chunk1",
        null,
        crypto.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE,
        "base64"
      ),
      crypto.crypto_secretstream_xchacha20poly1305_push(
        state,
        "chunk2",
        null,
        crypto.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE,
        "base64"
      ),
      crypto.crypto_secretstream_xchacha20poly1305_push(
        state,
        "chunk3",
        null,
        crypto.crypto_secretstream_xchacha20poly1305_TAG_FINAL,
        "base64"
      )
    ]
  };
}

export async function streamingDecrypt(
  crypto: ISodium,
  key: Uint8Array,
  cipher: { header: string; chunks: string[] }
) {
  await crypto.initialize();
  const state = crypto.crypto_secretstream_xchacha20poly1305_init_pull(
    crypto.from_base64(cipher.header),
    key
  );
  return [
    crypto.crypto_secretstream_xchacha20poly1305_pull(
      state,
      crypto.from_base64(cipher.chunks[0]),
      null,
      "text"
    ),
    crypto.crypto_secretstream_xchacha20poly1305_pull(
      state,
      crypto.from_base64(cipher.chunks[1]),
      null,
      "text"
    ),
    crypto.crypto_secretstream_xchacha20poly1305_pull(
      state,
      crypto.from_base64(cipher.chunks[2]),
      null,
      "text"
    )
  ];
}

export async function decrypt(
  crypto: ISodium,
  cipher: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
) {
  await crypto.initialize();
  return crypto.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    cipher,
    null,
    nonce,
    key,
    "text"
  );
}

export async function encrypt(
  crypto: ISodium,
  nonce: Uint8Array,
  key: Uint8Array
) {
  await crypto.initialize();
  return crypto.crypto_aead_xchacha20poly1305_ietf_encrypt(
    "mystring",
    null,
    null,
    nonce,
    key,
    "base64"
  );
}

export async function getKey(crypto: ISodium) {
  await crypto.initialize();

  const saltBytes: Uint8Array = crypto.randombytes_buf(
    crypto.crypto_pwhash_SALTBYTES
  );
  const key = crypto.crypto_pwhash(
    crypto.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    "mypassword",
    saltBytes,
    3, // operations limit
    1024 * 1024 * 8, // memory limit (8MB)
    crypto.crypto_pwhash_ALG_ARGON2I13
  );
  return { key, salt: saltBytes };
}

export async function hash(crypto: ISodium) {
  await crypto.initialize();
  const saltBytes = crypto.crypto_generichash(
    crypto.crypto_pwhash_SALTBYTES,
    "mysalt"
  );
  return crypto.crypto_pwhash(
    32,
    "mypassword",
    saltBytes,
    3, // operations limit
    1024 * 1024 * 64, // memory limit (8MB)
    crypto.crypto_pwhash_ALG_ARGON2ID13,
    "base64"
  );
}
