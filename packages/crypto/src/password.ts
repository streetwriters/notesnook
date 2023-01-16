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
  crypto_generichash,
  crypto_pwhash,
  crypto_pwhash_ALG_ARGON2ID13,
  crypto_pwhash_SALTBYTES
} from "libsodium-wrappers";

export default class Password {
  static hash(password: string, salt: string): string {
    const saltBytes = crypto_generichash(crypto_pwhash_SALTBYTES, salt);
    const hash = crypto_pwhash(
      32,
      password,
      saltBytes,
      3, // operations limit
      1024 * 1024 * 64, // memory limit (8MB)
      crypto_pwhash_ALG_ARGON2ID13,
      "base64"
    );
    return hash;
  }
}
