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

import { GroupHeader } from "../types";

type BatchOperator<T> = (ids: string[], items: T[]) => Promise<unknown[]>;
type Batch<T> = {
  items: T[];
  groups?: Map<number, { index: number; hidden?: boolean; group: GroupHeader }>;
  data?: unknown[];
};
export class VirtualizedGrouping<T> {
  private cache: Map<number, Batch<T>> = new Map();
  private pending: Map<number, Promise<Batch<T>>> = new Map();
  public ids: number[];
  private loadBatchTimeout?: number;

  constructor(
    count: number,
    private readonly batchSize: number,
    private readonly fetchItems: (
      start: number,
      end: number
    ) => Promise<{ ids: string[]; items: T[] }>,
    private readonly groupItems?: (
      items: T[]
    ) => Map<number, { index: number; hidden?: boolean; group: GroupHeader }>,
    readonly groups?: () => Promise<{ index: number; group: GroupHeader }[]>
  ) {
    this.ids = new Array(count).fill(0);
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

  item(index: number): Promise<{ item: T; group?: GroupHeader }>;
  item(
    index: number,
    operate: BatchOperator<T>
  ): Promise<{ item: T; group?: GroupHeader; data: unknown }>;
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
   * Reload the cache
   */
  refresh(ids: number[]) {
    this.ids = ids;
    this.cache.clear();
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
    const start = batchIndex * this.batchSize;
    const end = start + this.batchSize;

    const { ids, items } = await this.fetchItems(start, end);
    const groups = this.groupItems?.(items);

    if (
      lastBatch &&
      lastBatch.groups &&
      lastBatch.groups.size > 0 &&
      groups &&
      groups.size > 0 &&
      lastBatchIndex !== undefined
    ) {
      const [, firstGroup] = firstInMap(groups);
      // if user is moving downwards, we hide the first group from the
      // current batch, otherwise we hide the last group from the previous
      // batch.
      const group =
        lastBatchIndex < batchIndex
          ? firstGroup
          : lastInMap(lastBatch.groups)[1];

      // if the last group of the previous batch has the same title as the
      // first group of the current batch, we hide the current group otherwise
      // we will be seeing 2 group headers with the same title.
      if (group && firstGroup && group.group.title === firstGroup.group.title) {
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
    if (this.cache.size <= 2) return;
    for (const [key] of this.cache) {
      this.cache.delete(key);
      if (this.cache.size === 2) break;
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
