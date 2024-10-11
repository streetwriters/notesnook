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

import { Cipher } from "@notesnook/crypto";
import { StorageAccessor } from "../interfaces.js";
import { randomBytes } from "./random.js";

export type CryptoAccessor = () => Crypto;
export class Crypto {
  constructor(private readonly storage: StorageAccessor) {}
  async generateRandomKey() {
    const passwordBytes = randomBytes(124);
    const password = passwordBytes.toString("base64");
    return await this.storage().generateCryptoKey(password);
  }
}

export function isCipher(item: any): item is Cipher<"base64"> {
  return (
    item !== null &&
    typeof item === "object" &&
    "cipher" in item &&
    "iv" in item &&
    "salt" in item
  );
}
