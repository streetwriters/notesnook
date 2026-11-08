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

import * as Keychain from "react-native-keychain";
import type { SafeStorage } from "../../../platform";
import { decrypt, encrypt } from "./database/encryption";
import { generateSecureRandom } from "./database/random";

const SERVER = "notesnook-desktop:safe-storage";

async function getKey() {
  const stored = await Keychain.getInternetCredentials(SERVER);
  if (stored) return stored.password;
  const key = Array.from(await generateSecureRandom(32), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  await Keychain.setInternetCredentials(SERVER, "notesnook", key, {});
  return key;
}

export const safeStorage: SafeStorage = {
  async isEncryptionAvailable() {
    return true;
  },
  async encryptString(plainText) {
    const cipher = await encrypt({ password: await getKey() }, plainText);
    return new TextEncoder().encode(JSON.stringify(cipher));
  },
  async decryptString(data) {
    const cipher = JSON.parse(new TextDecoder().decode(data));
    return (await decrypt({ password: await getKey() }, cipher)) as string;
  }
};
