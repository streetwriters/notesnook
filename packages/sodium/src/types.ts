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

import type sodium from "libsodium-wrappers-sumo";

export enum base64_variants {
  ORIGINAL = 1,
  ORIGINAL_NO_PADDING = 3,
  URLSAFE = 5,
  URLSAFE_NO_PADDING = 7
}

export interface ISodium {
  initialize(): Promise<void>;

  get crypto_generichash(): typeof sodium.crypto_generichash;

  get crypto_pwhash(): typeof sodium.crypto_pwhash;
  get crypto_pwhash_ALG_ARGON2ID13(): typeof sodium.crypto_pwhash_ALG_ARGON2ID13;
  get crypto_pwhash_SALTBYTES(): typeof sodium.crypto_pwhash_SALTBYTES;
  get crypto_pwhash_ALG_ARGON2I13(): typeof sodium.crypto_pwhash_ALG_ARGON2I13;
  get crypto_pwhash_ALG_DEFAULT(): typeof sodium.crypto_pwhash_ALG_DEFAULT;
  get crypto_pwhash_OPSLIMIT_INTERACTIVE(): typeof sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE;
  get crypto_pwhash_OPSLIMIT_MODERATE(): typeof sodium.crypto_pwhash_OPSLIMIT_MODERATE;
  get crypto_pwhash_OPSLIMIT_SENSITIVE(): typeof sodium.crypto_pwhash_OPSLIMIT_SENSITIVE;
  get crypto_pwhash_MEMLIMIT_INTERACTIVE(): typeof sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE;
  get crypto_pwhash_MEMLIMIT_MODERATE(): typeof sodium.crypto_pwhash_MEMLIMIT_MODERATE;
  get crypto_pwhash_MEMLIMIT_SENSITIVE(): typeof sodium.crypto_pwhash_MEMLIMIT_SENSITIVE;

  // helpers
  from_base64(input: string, variant?: base64_variants): Uint8Array;
  to_base64(input: string | Uint8Array, variant?: base64_variants): string;
  get randombytes_buf(): typeof sodium.randombytes_buf;
  get to_string(): typeof sodium.to_string;
  get from_hex(): typeof sodium.from_hex;

  // aead
  get crypto_aead_xchacha20poly1305_ietf_KEYBYTES(): typeof sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES;
  get crypto_aead_xchacha20poly1305_ietf_encrypt(): typeof sodium.crypto_aead_xchacha20poly1305_ietf_encrypt;
  get crypto_aead_xchacha20poly1305_ietf_decrypt(): typeof sodium.crypto_aead_xchacha20poly1305_ietf_decrypt;
  get crypto_secretstream_xchacha20poly1305_init_push(): typeof sodium.crypto_secretstream_xchacha20poly1305_init_push;
  get crypto_secretstream_xchacha20poly1305_push(): typeof sodium.crypto_secretstream_xchacha20poly1305_push;
  get crypto_secretstream_xchacha20poly1305_init_pull(): typeof sodium.crypto_secretstream_xchacha20poly1305_init_pull;
  get crypto_secretstream_xchacha20poly1305_pull(): typeof sodium.crypto_secretstream_xchacha20poly1305_pull;
  get crypto_aead_xchacha20poly1305_ietf_NPUBBYTES(): typeof sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
  get crypto_secretstream_xchacha20poly1305_TAG_FINAL(): typeof sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL;
  get crypto_secretstream_xchacha20poly1305_TAG_MESSAGE(): typeof sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;
}
