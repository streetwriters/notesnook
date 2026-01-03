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
  private installs: Record<string, string[]> = {};
  constructor(private readonly config: WorkersKVRESTConfig) {
    this.mutex = new Mutex();
    this.client = new Cloudflare({
      apiToken: this.config.cfAuthToken
    });
  }

  async increment(key: string, uid: string) {
    return await this.mutex.runExclusive(async () => {
      const existing = this.installs[key] || [];
      const installsSet = Array.from(new Set([...existing, uid]));
      await write(this.client, this.config, key, installsSet);
      this.installs[key] = installsSet;
      return installsSet.length;
    });
  }

  async counts(keys: string[]): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    const installs = await readMulti(this.client, this.config, keys);
    for (const [key, value] of Object.entries(installs)) {
      result[key] = value.length;
    }
    this.installs = installs;
    return result;
  }
}

async function readMulti(
  client: Cloudflare,
  config: WorkersKVRESTConfig,
  keys: string[]
): Promise<Record<string, string[]>> {
  try {
    const response = await client.kv.namespaces.bulkGet(config.namespaceId, {
      account_id: config.cfAccountId,
      keys,
      type: "json",
      withMetadata: false
    });
    const result: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(response?.values || {})) {
      result[key] = value;
    }
    return result;
  } catch (e) {
    console.error(e);
    return {};
  }
}

function write<T>(
  client: Cloudflare,
  config: WorkersKVRESTConfig,
  key: string,
  data: T
) {
  return client.kv.namespaces.values.update(config.namespaceId, key + "_test", {
    account_id: config.cfAccountId,
    value: JSON.stringify(data)
  });
}
