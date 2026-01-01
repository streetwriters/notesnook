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

import { Mutex } from "async-mutex";
import WorkersKVREST from "@sagi.io/workers-kv";

export class KVCounter {
  private readonly kv: WorkersKVREST;
  private readonly mutex: Mutex;
  constructor(config: {
    cfAccountId: string;
    cfAuthToken: string;
    namespaceId: string;
  }) {
    this.mutex = new Mutex();
    this.kv = new WorkersKVREST(config);
  }

  async increment(key: string, uid: string) {
    await this.mutex.runExclusive(async () => {
      const existing = await read<string[]>(this.kv, key, []);
      await write(this.kv, key, Array.from(new Set([...existing, uid])));
    });
  }

  async counts(key: string): Promise<number> {
    const installs = await read<string[]>(this.kv, key, []);
    return installs.length;
  }
}

async function read<T>(
  kv: WorkersKVREST,
  key: string,
  fallback: T
): Promise<T> {
  try {
    const response = await kv.readKey({
      key
    });
    if (typeof response === "object" && !response.success) {
      // console.error("failed:", response.errors);
      return fallback;
    }
    return (
      JSON.parse(typeof response === "string" ? response : response.result) ||
      fallback
    );
  } catch (e) {
    // console.error(e);
    return fallback;
  }
}

async function write<T>(kv: WorkersKVREST, key: string, data: T) {
  await kv.writeKey({
    key,
    value: JSON.stringify(data)
  });
}
