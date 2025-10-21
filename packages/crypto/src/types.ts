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

import { StringOutputFormat, Uint8ArrayOutputFormat } from "@notesnook/sodium";

export type DataFormat = Uint8ArrayOutputFormat | StringOutputFormat;

export type Cipher<TFormat extends DataFormat> = {
  format: TFormat;
  alg: string;
  cipher: Output<TFormat>;
  iv: string;
  salt: string;
  length: number;
};

export type AsymmetricCipher<TFormat extends DataFormat> = Omit<
  Cipher<TFormat>,
  "iv" | "salt"
>;

export type Output<TFormat extends DataFormat> =
  TFormat extends StringOutputFormat ? string : Uint8Array;
export type Input<TFormat extends DataFormat> = Output<TFormat>;

export type SerializedKey = {
  password?: string;
  key?: string;
  salt?: string;
};

export type EncryptionKey = {
  key: Uint8Array;
  salt: string;
};

export type Chunk = {
  data: Uint8Array;
  final: boolean;
};

export type EncryptionKeyPair = {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
};

export type SerializedKeyPair = {
  publicKey: string;
  privateKey: string;
};
