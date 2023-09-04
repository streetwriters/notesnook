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

import { NNCrypto, Chunk, SerializedKey } from "@notesnook/crypto";
import { expose, transfer } from "comlink";

class NNCryptoWorker extends NNCrypto {
  override async createDecryptionStream(
    key: SerializedKey,
    iv: string
  ): Promise<TransformStream<Uint8Array, Uint8Array>> {
    const stream = await super.createDecryptionStream(key, iv);
    return transfer(stream, [stream]);
  }

  override async createEncryptionStream(
    key: SerializedKey
  ): Promise<{ iv: string; stream: TransformStream<Chunk, Uint8Array> }> {
    const result = await super.createEncryptionStream(key);
    return transfer(result, [result.stream]);
  }
}

expose(new NNCryptoWorker());
