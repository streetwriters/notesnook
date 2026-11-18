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

import type { SafeStorage } from "../../../platform";

export const safeStorage: SafeStorage = {
  isEncryptionAvailable: async () => false,
  async encryptString() {
    throw new Error("safeStorage.encryptString is not implemented on web");
  },
  async decryptString() {
    throw new Error("safeStorage.decryptString is not implemented on web");
  }
};
