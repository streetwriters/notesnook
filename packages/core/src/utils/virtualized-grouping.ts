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

import { GroupHeader, isGroupHeader } from "../types";

type BatchOperator<T> = (
  ids: string[],
  items: Record<string, T>
) => Promise<Record<string, unknown>>;
type Batch<T> = { items: Record<string, T>; data?: Record<string, unknown> };
export class VirtualizedGrouping<T> {
  private cache: Map<number, Batch<T>> = new Map();
  private pending: Map<number, Promise<Batch<T>>> = new Map();
  groups: GroupHeader[] = [];

  constructor(
    public ids: (string | GroupHeader)[],
    private readonly batchSize: number,
    private readonly fetchItems: (ids: string[]) => Promise<Record<string, T>>
  ) {
    this.ids = ids;
    this.groups = ids.filter((i) => isGroupHeader(i)) as GroupHeader[];
  }

  getKey(index: number) {
    const item = this.ids[index];
    if (isGroupHeader(item)) return item.id;
    return item;
  }

  get ungrouped() {
    return this.ids.filter((i) => !isGroupHeader(i)) as string[];
  }

  /**
   * Get item from cache or request the appropriate batch for caching
   * and load it from there.
   */
  item(id: string): Promise<T | undefined>;
  item(
    id: string,
    operate: BatchOperator<T>
  ): Promise<{ item: T; data: unknown } | undefined>;
  async item(id: string, operate?: BatchOperator<T>) {
    const index = this.ids.indexOf(id);
    if (index <= -1) return;

    const batchIndex = Math.floor(index / this.batchSize);
    const { items, data } =
      this.cache.get(batchIndex) || (await this.loadBatch(batchIndex, operate));

    return operate ? { item: items[id], data: data?.[id] } : items[id];
  }

  /**
   * Reload the cache
   */
  refresh(ids: (string | GroupHeader)[]) {
    this.ids = ids;
    this.cache.clear();
  }

  /**
   *
   * @param index
   */
  private async load(batchIndex: number, operate?: BatchOperator<T>) {
    const start = batchIndex * this.batchSize;
    const end = start + this.batchSize;
    const batchIds = this.ids
      .slice(start, end)
      .filter((id) => typeof id === "string") as string[];
    const items = await this.fetchItems(batchIds);
    console.time("operate");
    const batch = {
      items,
      data: operate ? await operate(batchIds, items) : undefined
    };
    console.timeEnd("operate");
    this.cache.set(batchIndex, batch);
    this.clear();
    return batch;
  }

  private loadBatch(batch: number, operate?: BatchOperator<T>) {
    if (this.pending.has(batch)) return this.pending.get(batch)!;
    console.time("loading batch");
    const promise = this.load(batch, operate);
    this.pending.set(batch, promise);
    return promise.finally(() => {
      console.timeEnd("loading batch");
      this.pending.delete(batch);
    });
  }

  private clear() {
    if (this.cache.size <= 2) return;
    for (const [key] of this.cache) {
      this.cache.delete(key);
      if (this.cache.size === 2) break;
    }
  }
}
