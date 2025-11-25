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

import type { QueryResult } from "@streetwriters/kysely";

export type Promisable<T> = T | Promise<T>;

export type RunMode = "exec" | "query" | "raw";

export type MainMsg =
  | {
      type: "run";
      mode: RunMode;
      sql: string;
      parameters?: readonly unknown[];
    }
  | {
      type: "close";
    }
  | {
      type: "init";
      url?: string;
      dbName: string;
    };

export type WorkerMsg = {
  [K in keyof Events]: {
    type: K;
    data: Events[K];
    err: unknown;
  };
}[keyof Events];
type Events = {
  run: QueryResult<any> | null;
  init: null;
  close: null;
};
export type EventWithError = {
  [K in keyof Events]: {
    data: Events[K];
    err: unknown;
  };
};
