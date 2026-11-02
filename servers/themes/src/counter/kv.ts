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
import { Cloudflare } from "cloudflare";

type WorkersKVRESTConfig = {
  cfAccountId: string;
  cfAuthToken: string;
  namespaceId: string;
};
export class KVCounter {
  private readonly client: Cloudflare;
  private readonly mutex: Mutex;
  private installs: Record<string, string[] | null> = {};
  constructor(private readonly config: WorkersKVRESTConfig) {
    this.mutex = new Mutex();
    this.client = new Cloudflare({
      apiToken: this.config.cfAuthToken
    });
  }

  async increment(key: string, uid: string) {
    return await this.mutex.runExclusive(async () => {
      if (!(key in this.installs)) {
        const installs = await readMulti(this.client, this.config, [key]);
        // writing without the existing set would overwrite it in KV
        if (!(key in installs))
          throw new Error(`Could not read installs for ${key}`);
        this.installs[key] = installs[key];
      }
      const existing = this.installs[key] || [];
      const installsSet = Array.from(new Set([...existing, uid]));
      await write(this.client, this.config, key, installsSet);
      this.installs[key] = installsSet;
      return installsSet.length;
    });
  }

  async counts(keys: string[]): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    // keys whose read failed keep their previously known installs
    this.installs = {
      ...this.installs,
      ...(await readMulti(this.client, this.config, keys))
    };
    for (const key of keys) {
      result[key] = this.installs[key]?.length ?? 0;
    }
    return result;
  }
}

const BULK_GET_LIMIT = 100;
async function readMulti(
  client: Cloudflare,
  config: WorkersKVRESTConfig,
  keys: string[]
): Promise<Record<string, string[] | null>> {
  const result: Record<string, string[] | null> = {};
  for (let i = 0; i < keys.length; i += BULK_GET_LIMIT) {
    const chunk = keys.slice(i, i + BULK_GET_LIMIT);
    try {
      const response = await client.kv.namespaces.bulkGet(config.namespaceId, {
        account_id: config.cfAccountId,
        keys: chunk,
        type: "json",
        withMetadata: false
      });
      const values = (response?.values || {}) as Record<
        string,
        string[] | null
      >;
      for (const key of chunk) {
        result[key] = values[key] ?? null;
      }
    } catch (e) {
      console.error("Failed to read installs from KV:", e);
    }
  }
  return result;
}

function write<T>(
  client: Cloudflare,
  config: WorkersKVRESTConfig,
  key: string,
  data: T
) {
  return client.kv.namespaces.values.update(config.namespaceId, key, {
    account_id: config.cfAccountId,
    value: JSON.stringify(data)
  });
}
