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
  crypto_pwhash as sodium_native_crypto_pwhash,
  crypto_generichash as sodium_native_crypto_generichash,
  sodium_memzero,
  crypto_aead_xchacha20poly1305_ietf_ABYTES,
  randombytes_buf as sodium_native_randombytes_buf,
  crypto_aead_xchacha20poly1305_ietf_encrypt as sodium_native_crypto_aead_xchacha20poly1305_ietf_encrypt,
  crypto_secretstream_xchacha20poly1305_init_push as sodium_native_crypto_secretstream_xchacha20poly1305_init_push,
  crypto_secretstream_xchacha20poly1305_push as sodium_native_crypto_secretstream_xchacha20poly1305_push,
  crypto_aead_xchacha20poly1305_ietf_decrypt as sodium_native_crypto_aead_xchacha20poly1305_ietf_decrypt,
  crypto_secretstream_xchacha20poly1305_init_pull as sodium_native_crypto_secretstream_xchacha20poly1305_init_pull,
  crypto_secretstream_xchacha20poly1305_pull as sodium_native_crypto_secretstream_xchacha20poly1305_pull,
  crypto_secretstream_xchacha20poly1305_HEADERBYTES,
  crypto_secretstream_xchacha20poly1305_ABYTES,
  crypto_secretstream_xchacha20poly1305_STATEBYTES,
  crypto_secretstream_xchacha20poly1305_TAGBYTES,
  crypto_pwhash_ALG_ARGON2ID13,
  crypto_pwhash_SALTBYTES,
  crypto_pwhash_ALG_ARGON2I13,
  crypto_pwhash_ALG_DEFAULT,
  crypto_pwhash_OPSLIMIT_INTERACTIVE,
  crypto_pwhash_OPSLIMIT_MODERATE,
  crypto_pwhash_OPSLIMIT_SENSITIVE,
  crypto_pwhash_MEMLIMIT_INTERACTIVE,
  crypto_pwhash_MEMLIMIT_MODERATE,
  crypto_pwhash_MEMLIMIT_SENSITIVE,
  crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
  crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
  crypto_secretstream_xchacha20poly1305_TAG_FINAL,
  crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
} from "sodium-native";
import { Buffer } from "node:buffer";
import { base64_variants, ISodium } from "./types";

export type Uint8ArrayOutputFormat = "uint8array";
export type StringOutputFormat = "text" | "hex" | "base64";
export type StateAddress = { name: string };
export interface MessageTag {
  message: Uint8Array;
  tag: number;
}
export interface StringMessageTag {
  message: string;
  tag: number;
}

function crypto_pwhash(
  keyLength: number,
  password: string | Uint8Array,
  salt: Uint8Array,
  opsLimit: number,
  memLimit: number,
  algorithm: number,
  outputFormat?: Uint8ArrayOutputFormat | null
): Uint8Array;
function crypto_pwhash(
  keyLength: number,
  password: string | Uint8Array,
  salt: Uint8Array,
  opsLimit: number,
  memLimit: number,
  algorithm: number,
  outputFormat: StringOutputFormat
): string;
function crypto_pwhash(
  keyLength: number,
  password: string | Uint8Array,
  salt: Uint8Array,
  opsLimit: number,
  memLimit: number,
  algorithm: number,
  outputFormat?: StringOutputFormat | Uint8ArrayOutputFormat | null
): string | Uint8Array {
  return wrap(
    keyLength,
    (output) =>
      sodium_native_crypto_pwhash(
        output,
        toBuffer(password),
        toBuffer(salt),
        opsLimit,
        memLimit,
        algorithm
      ),
    outputFormat
  );
}

function crypto_generichash(
  hash_length: number,
  message: string | Uint8Array,
  key?: string | Uint8Array | null,
  outputFormat?: Uint8ArrayOutputFormat | null
): Uint8Array;
function crypto_generichash(
  hash_length: number,
  message: string | Uint8Array,
  key: string | Uint8Array | null,
  outputFormat: StringOutputFormat
): string;
function crypto_generichash(
  hash_length: number,
  message: string | Uint8Array,
  key?: string | Uint8Array | null,
  outputFormat?: StringOutputFormat | Uint8ArrayOutputFormat | null
): string | Uint8Array {
  return wrap(
    hash_length,
    (output) => {
      if (key)
        sodium_native_crypto_generichash(
          output,
          toBuffer(message),
          toBuffer(key)
        );
      else sodium_native_crypto_generichash(output, toBuffer(message));
    },
    outputFormat
  );
}

function crypto_aead_xchacha20poly1305_ietf_encrypt(
  message: string | Uint8Array,
  additional_data: string | Uint8Array | null,
  secret_nonce: string | Uint8Array | null,
  public_nonce: Uint8Array,
  key: Uint8Array,
  outputFormat?: Uint8ArrayOutputFormat | null
): Uint8Array;
function crypto_aead_xchacha20poly1305_ietf_encrypt(
  message: string | Uint8Array,
  additional_data: string | Uint8Array | null,
  secret_nonce: string | Uint8Array | null,
  public_nonce: Uint8Array,
  key: Uint8Array,
  outputFormat: StringOutputFormat
): string;
function crypto_aead_xchacha20poly1305_ietf_encrypt(
  message: string | Uint8Array,
  additional_data: string | Uint8Array | null,
  secret_nonce: string | Uint8Array | null,
  public_nonce: Uint8Array,
  key: Uint8Array,
  outputFormat?: StringOutputFormat | Uint8ArrayOutputFormat | null
): string | Uint8Array {
  const m = toBuffer(message);
  return wrap(
    m.byteLength + crypto_aead_xchacha20poly1305_ietf_ABYTES,
    (output) =>
      sodium_native_crypto_aead_xchacha20poly1305_ietf_encrypt(
        output,
        m,
        toBuffer(additional_data) || null,
        null,
        toBuffer(public_nonce),
        toBuffer(key)
      ),
    outputFormat
  );
}

function crypto_secretstream_xchacha20poly1305_init_push(
  key: Uint8Array,
  outputFormat?: Uint8ArrayOutputFormat | null
): { state: StateAddress; header: Uint8Array };
function crypto_secretstream_xchacha20poly1305_init_push(
  key: Uint8Array,
  outputFormat: StringOutputFormat
): { state: StateAddress; header: string };
function crypto_secretstream_xchacha20poly1305_init_push(
  key: Uint8Array,
  outputFormat?: StringOutputFormat | Uint8ArrayOutputFormat | null
): { state: StateAddress; header: string | Uint8Array } {
  const state = Buffer.alloc(crypto_secretstream_xchacha20poly1305_STATEBYTES);

  const header = wrap(
    crypto_secretstream_xchacha20poly1305_HEADERBYTES,
    (header) =>
      sodium_native_crypto_secretstream_xchacha20poly1305_init_push(
        state,
        header,
        toBuffer(key)
      ),
    outputFormat
  );
  return { state: state as unknown as StateAddress, header };
}

function crypto_secretstream_xchacha20poly1305_push(
  state_address: StateAddress,
  message_chunk: string | Uint8Array,
  ad: string | Uint8Array | null,
  tag: number,
  outputFormat?: Uint8ArrayOutputFormat | null
): Uint8Array;
function crypto_secretstream_xchacha20poly1305_push(
  state_address: StateAddress,
  message_chunk: string | Uint8Array,
  ad: string | Uint8Array | null,
  tag: number,
  outputFormat: StringOutputFormat
): string;
function crypto_secretstream_xchacha20poly1305_push(
  state_address: StateAddress,
  message_chunk: string | Uint8Array,
  ad: string | Uint8Array | null,
  tag: number,
  outputFormat?: StringOutputFormat | Uint8ArrayOutputFormat | null
): string | Uint8Array {
  const message = toBuffer(message_chunk);
  return wrap(
    message.byteLength + crypto_secretstream_xchacha20poly1305_ABYTES,
    (cipher) =>
      sodium_native_crypto_secretstream_xchacha20poly1305_push(
        state_address as unknown as Buffer,
        cipher,
        message,
        toBuffer(ad) || null,
        tag
      ),
    outputFormat
  );
}

function crypto_aead_xchacha20poly1305_ietf_decrypt(
  secret_nonce: string | Uint8Array | null,
  ciphertext: string | Uint8Array,
  additional_data: string | Uint8Array | null,
  public_nonce: Uint8Array,
  key: Uint8Array,
  outputFormat?: Uint8ArrayOutputFormat | null
): Uint8Array;
function crypto_aead_xchacha20poly1305_ietf_decrypt(
  secret_nonce: string | Uint8Array | null,
  ciphertext: string | Uint8Array,
  additional_data: string | Uint8Array | null,
  public_nonce: Uint8Array,
  key: Uint8Array,
  outputFormat: StringOutputFormat
): string;
function crypto_aead_xchacha20poly1305_ietf_decrypt(
  _secret_nonce: string | Uint8Array | null,
  ciphertext: string | Uint8Array,
  additional_data: string | Uint8Array | null,
  public_nonce: Uint8Array,
  key: Uint8Array,
  outputFormat?: StringOutputFormat | Uint8ArrayOutputFormat | null
): string | Uint8Array {
  const cipher = toBuffer(ciphertext);
  return wrap(
    cipher.byteLength - crypto_aead_xchacha20poly1305_ietf_ABYTES,
    (message) =>
      sodium_native_crypto_aead_xchacha20poly1305_ietf_decrypt(
        message,
        null,
        cipher,
        toBuffer(additional_data) || null,
        toBuffer(public_nonce),
        toBuffer(key)
      ),
    outputFormat
  );
}

function crypto_secretstream_xchacha20poly1305_init_pull(
  header: Uint8Array,
  key: Uint8Array
): StateAddress {
  const state = Buffer.alloc(crypto_secretstream_xchacha20poly1305_STATEBYTES);
  sodium_native_crypto_secretstream_xchacha20poly1305_init_pull(
    state,
    toBuffer(header),
    toBuffer(key)
  );
  return state as unknown as StateAddress;
}

function crypto_secretstream_xchacha20poly1305_pull(
  state_address: StateAddress,
  cipher: string | Uint8Array,
  ad?: string | Uint8Array | null,
  outputFormat?: Uint8ArrayOutputFormat | null
): MessageTag;
function crypto_secretstream_xchacha20poly1305_pull(
  state_address: StateAddress,
  cipher: string | Uint8Array,
  ad: string | Uint8Array | null,
  outputFormat: StringOutputFormat
): StringMessageTag;
function crypto_secretstream_xchacha20poly1305_pull(
  state_address: StateAddress,
  ciphertext: string | Uint8Array,
  ad?: string | Uint8Array | null,
  outputFormat?: StringOutputFormat | Uint8ArrayOutputFormat | null
): MessageTag | StringMessageTag {
  const tag = Buffer.alloc(crypto_secretstream_xchacha20poly1305_TAGBYTES);
  const cipher = toBuffer(ciphertext);
  const message = wrap(
    cipher.byteLength - crypto_secretstream_xchacha20poly1305_ABYTES,
    (message) =>
      sodium_native_crypto_secretstream_xchacha20poly1305_pull(
        state_address as unknown as Buffer,
        message,
        tag,
        cipher,
        toBuffer(ad) || null
      ),
    outputFormat
  );
  return { message, tag: tag.readUInt8() } as MessageTag | StringMessageTag;
}

function randombytes_buf(
  length: number,
  outputFormat?: Uint8ArrayOutputFormat | null
): Uint8Array;
function randombytes_buf(
  length: number,
  outputFormat: StringOutputFormat
): string;
function randombytes_buf(
  length: number,
  outputFormat?: StringOutputFormat | Uint8ArrayOutputFormat | null
): string | Uint8Array {
  return wrap(
    length,
    (output) => sodium_native_randombytes_buf(output),
    outputFormat
  );
}

function from_base64(input: string, variant?: base64_variants): Uint8Array {
  return new Uint8Array(
    Buffer.from(
      variant === base64_variants.URLSAFE_NO_PADDING ||
        variant === base64_variants.ORIGINAL_NO_PADDING
        ? appendPadding(input)
        : input,
      variant === base64_variants.URLSAFE ||
        variant === base64_variants.URLSAFE_NO_PADDING
        ? "base64url"
        : "base64"
    )
  );
}

function to_base64(
  input: string | Uint8Array,
  variant: base64_variants = base64_variants.URLSAFE_NO_PADDING
): string {
  const base64 = toBuffer(input).toString(
    variant === base64_variants.URLSAFE ||
      variant === base64_variants.URLSAFE_NO_PADDING
      ? "base64url"
      : "base64"
  );
  return variant === base64_variants.URLSAFE_NO_PADDING ||
    variant === base64_variants.ORIGINAL_NO_PADDING
    ? trimPadding(base64)
    : variant === base64_variants.URLSAFE
    ? appendPadding(base64)
    : base64;
}

function from_hex(input: string): Uint8Array {
  return new Uint8Array(Buffer.from(input, "hex"));
}

function to_string(input: Uint8Array): string {
  return Buffer.from(input, input.byteOffset, input.byteLength).toString(
    "utf-8"
  );
}

type ToBufferInput = string | Uint8Array | null | undefined;
type ToBufferResult<TInput extends ToBufferInput> = TInput extends
  | undefined
  | null
  ? Buffer | undefined
  : Buffer;
function toBuffer<TInput extends ToBufferInput>(
  input: TInput
): ToBufferResult<TInput> {
  if (input instanceof Uint8Array) {
    return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  } else if (typeof input === "undefined" || input === null) {
    return undefined as ToBufferResult<TInput>;
  } else {
    return Buffer.from(input, "utf8");
  }
}

function wrap(
  length: number,
  action: (buffer: Buffer) => void,
  outputFormat?: StringOutputFormat | Uint8ArrayOutputFormat | null
): string | Uint8Array {
  const output = Buffer.alloc(length);

  action(output);

  if (!outputFormat || outputFormat === "uint8array") {
    return new Uint8Array(output);
  }

  const string = output.toString(
    outputFormat === "text"
      ? "utf8"
      : outputFormat === "base64"
      ? "base64url"
      : "hex"
  );

  sodium_memzero(output);
  return string;
}

function appendPadding(str: string): string {
  str = str || "";
  if (str.length % 4) {
    str += "=".repeat(4 - (str.length % 4));
  }
  return str;
}

function trimPadding(str: string): string {
  while (str.length && str[str.length - 1] === "=") {
    str = str.slice(0, -1);
  }
  return str;
}

export class Sodium implements ISodium {
  async initialize() {}

  get crypto_generichash() {
    return crypto_generichash;
  }

  get crypto_pwhash() {
    return crypto_pwhash;
  }

  get crypto_pwhash_ALG_ARGON2ID13() {
    return crypto_pwhash_ALG_ARGON2ID13;
  }
  get crypto_pwhash_SALTBYTES() {
    return crypto_pwhash_SALTBYTES;
  }
  get crypto_pwhash_ALG_ARGON2I13() {
    return crypto_pwhash_ALG_ARGON2I13;
  }
  get crypto_pwhash_ALG_DEFAULT() {
    return crypto_pwhash_ALG_DEFAULT;
  }
  get crypto_pwhash_OPSLIMIT_INTERACTIVE() {
    return crypto_pwhash_OPSLIMIT_INTERACTIVE;
  }
  get crypto_pwhash_OPSLIMIT_MODERATE() {
    return crypto_pwhash_OPSLIMIT_MODERATE;
  }
  get crypto_pwhash_OPSLIMIT_SENSITIVE() {
    return crypto_pwhash_OPSLIMIT_SENSITIVE;
  }
  get crypto_pwhash_MEMLIMIT_INTERACTIVE() {
    return crypto_pwhash_MEMLIMIT_INTERACTIVE;
  }
  get crypto_pwhash_MEMLIMIT_MODERATE() {
    return crypto_pwhash_MEMLIMIT_MODERATE;
  }
  get crypto_pwhash_MEMLIMIT_SENSITIVE() {
    return crypto_pwhash_MEMLIMIT_SENSITIVE;
  }

  // helpers
  get from_base64() {
    return from_base64;
  }
  get to_base64() {
    return to_base64;
  }
  get randombytes_buf() {
    return randombytes_buf;
  }
  get to_string() {
    return to_string;
  }
  get from_hex() {
    return from_hex;
  }

  // aead
  get crypto_aead_xchacha20poly1305_ietf_KEYBYTES() {
    return crypto_aead_xchacha20poly1305_ietf_KEYBYTES;
  }
  get crypto_aead_xchacha20poly1305_ietf_encrypt() {
    return crypto_aead_xchacha20poly1305_ietf_encrypt;
  }
  get crypto_aead_xchacha20poly1305_ietf_decrypt() {
    return crypto_aead_xchacha20poly1305_ietf_decrypt;
  }
  get crypto_secretstream_xchacha20poly1305_init_push() {
    return crypto_secretstream_xchacha20poly1305_init_push;
  }
  get crypto_secretstream_xchacha20poly1305_push() {
    return crypto_secretstream_xchacha20poly1305_push;
  }
  get crypto_secretstream_xchacha20poly1305_init_pull() {
    return crypto_secretstream_xchacha20poly1305_init_pull;
  }
  get crypto_secretstream_xchacha20poly1305_pull() {
    return crypto_secretstream_xchacha20poly1305_pull;
  }
  get crypto_aead_xchacha20poly1305_ietf_NPUBBYTES() {
    return crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
  }
  get crypto_secretstream_xchacha20poly1305_TAG_FINAL() {
    return crypto_secretstream_xchacha20poly1305_TAG_FINAL;
  }
  get crypto_secretstream_xchacha20poly1305_TAG_MESSAGE() {
    return crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;
  }
}

export { base64_variants, type ISodium };
