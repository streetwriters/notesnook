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

import { databaseTest } from "./utils/index.js";
import { test, expect } from "vitest";

test("remove all vaults", () =>
  databaseTest().then(async (db) => {
    const key = {
      format: "base64" as const,
      alg: "aes-256-gcm",
      cipher: "key",
      iv: "iv",
      salt: "salt",
      length: 16
    };

    await db.vaults.add({
      title: "Vault 1",
      key
    });
    await db.vaults.add({
      title: "Vault 2",
      key
    });

    expect(await db.vaults.all.count()).toBe(2);
    expect(await db.vaults.default()).toBeDefined();

    await db.vaults.removeAll();

    expect(await db.vaults.all.count()).toBe(0);
    expect(await db.vaults.default()).toBeUndefined();
  }));
