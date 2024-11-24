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

const cache: Record<
  string,
  {
    ttl: number;
    value: any;
    cachedAt: number;
  }
> = {};
export async function read<T>(key: string, fallback: T) {
  const cached = cache[key];
  if (cached && cached.ttl > Date.now() - cached.cachedAt) {
    return cached.value as T;
  }
  const value = (await provider).read<T>(key, fallback);
  cache[key] = {
    ttl: 60 * 60 * 1000,
    value,
    cachedAt: Date.now()
  };
  return value;
}

export async function write<T>(key: string, data: T) {
  if (cache[key]) {
    cache[key].value = data;
    cache[key].cachedAt = Date.now();
  }
  return (await provider).write<T>(key, data);
}

const provider = selectProvider();
async function selectProvider() {
  return await import("./kv").catch(() => import("./fs"));
}
