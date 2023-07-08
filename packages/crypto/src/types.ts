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

export type OutputFormat = Uint8ArrayOutputFormat | StringOutputFormat;

export type Cipher = {
  format: OutputFormat;
  alg: string;
  cipher: string | Uint8Array;
  iv: string;
  salt: string;
  length: number;
};

export type Plaintext = {
  format: OutputFormat;
  data: string | Uint8Array;
};

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
