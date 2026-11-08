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

import type { Dialect } from "@streetwriters/kysely";
import type { IStorage } from "@notesnook/core";
import type { Compression } from "./compression";
import type { DatabasePersistence } from "./storage";

export interface DialectOptions {
  name: string;
  encrypted: boolean;
}

export interface DatabaseHost {
  createDialect(options: DialectOptions): Dialect;
  journalMode: "WAL" | "DELETE" | "MEMORY";
  lockingMode: "exclusive" | "normal";
  createStorage(persistence: DatabasePersistence): Promise<IStorage>;
  getDatabaseKey(): Promise<string>;
  disableAppLock(): Promise<void>;
  delete(): Promise<void>;
  eventSource: unknown;
  compression: Compression;
}
