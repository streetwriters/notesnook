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

import { GroupHeader } from "../types.js";

type BatchOperator<T> = (ids: string[], items: T[]) => Promise<unknown[]>;
type Batch<T> = {
  items: T[];
  groups?: Map<number, { index: number; hidden?: boolean; group: GroupHeader }>;
  data?: unknown[];
};
const CACHE_SIZE = 2;
export class VirtualizedGrouping<T> {
  private cache: Map<number, Batch<T>> = new Map();
  private pending: Map<number, Promise<Batch<T>>> = new Map();
  private _placeholders: boolean[] = [];

  constructor(
    readonly length: number,
    private readonly batchSize: number,
    readonly ids: () => Promise<string[]>,
    private readonly fetchItems: (
      start: number,
      end: number
    ) => Promise<{ ids: string[]; items: T[] }>,
    private readonly groupItems?: (
      items: T[]
    ) => Map<number, { index: number; hidden?: boolean; group: GroupHeader }>,
    readonly groups?: () => Promise<{ index: number; group: GroupHeader }[]>
  ) {}

  get placeholders() {
    if (this._placeholders.length !== this.length) {
      this._placeholders = new Array(this.length).fill(true);
    }
    return this._placeholders;
  }

  key(index: number) {
    return `${index}`;
  }

  type(index: number) {
    const batchIndex = Math.floor(index / this.batchSize);
    const batch = this.cache.get(batchIndex);
    if (!batch) return "item";
    const { items, groups } = batch;
    const itemIndexInBatch = index - batchIndex * this.batchSize;
    const group = groups?.get(itemIndexInBatch);
    return group && !group.hidden && items[itemIndexInBatch]
      ? "header-item"
      : "item";
  }

  cacheItem(index: number) {
    const batchIndex = Math.floor(index / this.batchSize);
    const batch = this.cache.get(batchIndex);
    if (!batch) return;
    const { items, groups, data } = batch;
    const itemIndexInBatch = index - batchIndex * this.batchSize;
    const group = groups?.get(itemIndexInBatch);
    return {
      item: items[itemIndexInBatch],
      group: group && !group.hidden ? group.group : undefined,
      data: data?.[itemIndexInBatch]
    };
  }

  item(index: number): Promise<{ item?: T; group?: GroupHeader }>;
  item(
    index: number,
    operate: BatchOperator<T>
  ): Promise<{ item?: T; group?: GroupHeader; data: unknown }>;
  async item(index: number, operate?: BatchOperator<T>) {
    const batchIndex = Math.floor(index / this.batchSize);
    const { items, groups, data } =
      this.cache.get(batchIndex) ||
      (await this.batchLoader(batchIndex, operate));

    const itemIndexInBatch = index - batchIndex * this.batchSize;
    const group = groups?.get(itemIndexInBatch);
    return {
      item: items[itemIndexInBatch],
      group: group && !group.hidden ? group.group : undefined,
      data: data?.[itemIndexInBatch]
    };
  }

  /**
   *
   * @param index
   */
  private async load(
    batchIndex: number,
    operate?: BatchOperator<T>
  ): Promise<Batch<T>> {
    const [lastBatchIndex, lastBatch] = lastInMap(this.cache) || [];

    const direction =
      lastBatchIndex !== undefined && lastBatchIndex < batchIndex
        ? "down"
        : "up";

    const start = batchIndex * this.batchSize;
    const end = start + this.batchSize;

    const { ids, items } = await this.fetchItems(start, end);
    const groups = this.groupItems?.(items);

    if (items.length > this.batchSize)
      throw new Error("Got more items than the batch size.");

    if (direction === "down") {
      const [, firstGroup] = groups ? firstInMap(groups) : [];
      const group = lastBatch?.groups
        ? lastInMap(lastBatch.groups)[1]
        : undefined;

      if (group && firstGroup && group.group.title === firstGroup.group.title)
        firstGroup.hidden = true;
    } else {
      const prevGroups =
        this.groupItems && start > 0
          ? this.groupItems((await this.fetchItems(start - 1, start)).items)
          : undefined;

      if (prevGroups && groups) {
        const [, prevGroup] = lastInMap(prevGroups);
        const [, group] = firstInMap(groups);
        if (group && prevGroup?.group.title === group?.group.title)
          group.hidden = true;
      }
    }

    const batch = {
      items,
      groups,
      data: operate ? await operate(ids, items) : undefined
    };
    this.cache.set(batchIndex, batch);
    this.clear();
    return batch;
  }

  private batchLoader(batch: number, operate?: BatchOperator<T>) {
    if (this.pending.has(batch)) return this.pending.get(batch)!;
    const promise = this.load(batch, operate);
    this.pending.set(batch, promise);
    return promise.finally(() => {
      this.pending.delete(batch);
    });
  }

  private clear() {
    if (this.cache.size <= CACHE_SIZE) return;
    for (const [key] of this.cache) {
      this.cache.delete(key);
      if (this.cache.size === CACHE_SIZE) break;
    }
  }
}

function lastInMap<K, V>(map: Map<K, V>) {
  let i = 0;
  for (const item of map) {
    if (++i === map.size) return item;
  }
  return [undefined, undefined];
}

function firstInMap<K, V>(map: Map<K, V>) {
  let i = 0;
  for (const item of map) {
    if (++i === 1) return item;
  }
  return [undefined, undefined];
}
