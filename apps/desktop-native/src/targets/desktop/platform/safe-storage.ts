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
import * as SecureStorage from "@react-native-gpui/keychain";
import type { SafeStorage } from "../../../platform";
import { decrypt } from "./database/encryption";

const SERVER = "notesnook-desktop:safe-storage";

let legacyKeyLookup: Promise<string> | undefined;

function legacyKey() {
  legacyKeyLookup ??= Keychain.getInternetCredentials(SERVER).then((stored) => {
    if (!stored) throw new Error("The legacy safe storage key is missing.");
    return stored.password;
  });
  legacyKeyLookup.catch(() => (legacyKeyLookup = undefined));
  return legacyKeyLookup;
}

const SERVICE = "safe-storage";
const LEGACY_JSON = 0x7b;

export const safeStorage: SafeStorage = {
  isEncryptionAvailable: () => SecureStorage.isEncryptionAvailable(),
  encryptString: (plainText) => SecureStorage.encryptString(SERVICE, plainText),
  async decryptString(data) {
    if (data[0] === LEGACY_JSON) {
      const cipher = JSON.parse(new TextDecoder().decode(data));
      return (await decrypt({ password: await legacyKey() }, cipher)) as string;
    }
    return SecureStorage.decryptString(SERVICE, data);
  }
};
