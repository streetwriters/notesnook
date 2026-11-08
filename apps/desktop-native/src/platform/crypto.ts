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

export type CryptoKey = {
  readonly type: string;
  readonly usages: string[];
};

export type Algorithm = string | Record<string, unknown>;

export interface SubtleCryptoLike {
  importKey(
    format: string,
    keyData: ArrayBuffer | Uint8Array,
    algorithm: Algorithm,
    extractable: boolean,
    usages: string[]
  ): Promise<CryptoKey>;
  exportKey(format: string, key: CryptoKey): Promise<ArrayBuffer>;
  generateKey(
    algorithm: Algorithm,
    extractable: boolean,
    usages: string[]
  ): Promise<CryptoKey>;
  deriveKey(
    algorithm: Algorithm,
    baseKey: CryptoKey,
    derivedKeyType: Algorithm,
    extractable: boolean,
    usages: string[]
  ): Promise<CryptoKey>;
  deriveBits(
    algorithm: Algorithm,
    baseKey: CryptoKey,
    length: number
  ): Promise<ArrayBuffer>;
  wrapKey(
    format: string,
    key: CryptoKey,
    wrappingKey: CryptoKey,
    algorithm: Algorithm
  ): Promise<ArrayBuffer>;
  unwrapKey(
    format: string,
    wrappedKey: ArrayBuffer,
    unwrappingKey: CryptoKey,
    unwrapAlgorithm: Algorithm,
    unwrappedKeyAlgorithm: Algorithm,
    extractable: boolean,
    usages: string[]
  ): Promise<CryptoKey>;
  encrypt(
    algorithm: Algorithm,
    key: CryptoKey,
    data: ArrayBuffer | Uint8Array
  ): Promise<ArrayBuffer>;
  decrypt(
    algorithm: Algorithm,
    key: CryptoKey,
    data: ArrayBuffer | Uint8Array
  ): Promise<ArrayBuffer>;
}

export interface Crypto {
  readonly subtle: SubtleCryptoLike;
  getRandomValues<T extends ArrayBufferView>(array: T): T;
  xxh64(data: string | Uint8Array): Promise<string>;
}
