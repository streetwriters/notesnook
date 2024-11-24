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

import WorkersKVREST from "@sagi.io/workers-kv";

const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
const cfAuthToken = process.env.CLOUDFLARE_AUTH_TOKEN!;
const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID!;

if (!cfAccountId || !cfAuthToken || !namespaceId)
  throw new Error(
    "Please provide Cloudflare credentials to use Cloudflare KV API for storing data."
  );

const WorkersKV = new WorkersKVREST({
  cfAccountId,
  cfAuthToken,
  namespaceId
});

export async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const response = await WorkersKV.readKey({
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

export async function write<T>(key: string, data: T) {
  await WorkersKV.writeKey({
    key,
    value: JSON.stringify(data)
  });
}

read("spam-cache", "default").then(console.log);
