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
  groups?: { index: number; hidden?: boolean; group: GroupHeader }[];
  data?: unknown[];
};
export class VirtualizedGrouping<T> {
  private cache: Map<number, Batch<T>> = new Map();
  private pending: Map<number, Promise<Batch<T>>> = new Map();
  public ids: number[];
  private loadBatchTimeout?: number;
  private cacheHits = 0;

  constructor(
    count: number,
    private readonly batchSize: number,
    private readonly fetchItems: (
      start: number,
      end: number,
      cursor?: T
    ) => Promise<{ ids: string[]; items: T[] }>,
    private readonly groupItems?: (
      items: T[]
    ) => { index: number; hidden?: boolean; group: GroupHeader }[],
    readonly groups?: () => Promise<{ index: number; group: GroupHeader }[]>
  ) {
    this.ids = new Array(count).fill(0);
  }

  getKey(index: number) {
    return `${index}`;
  }

  item(index: number): Promise<{ item: T; group?: GroupHeader }>;
  item(
    index: number,
    operate: BatchOperator<T>
  ): Promise<{ item: T; group?: GroupHeader; data: unknown }>;
  async item(index: number, operate?: BatchOperator<T>) {
    const batchIndex = Math.floor(index / this.batchSize);
    if (this.cache.has(batchIndex)) this.cacheHits++;
    const { items, groups, data } =
      this.cache.get(batchIndex) || (await this.loadBatch(batchIndex, operate));

    const itemIndexInBatch = index - batchIndex * this.batchSize;
    const group = groups?.find(
      (f) => f.index === itemIndexInBatch && !f.hidden
    );
    return {
      item: items[itemIndexInBatch],
      group: group?.group,
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
    const lastBatchIndex = this.last;
    const prev = this.cache.get(lastBatchIndex);
    const start = batchIndex * this.batchSize;
    const end = start + this.batchSize;
    // we can use a cursor instead of start/end offsets for batches that are
    // right next to each other.
    const cursor =
      lastBatchIndex + 1 === batchIndex
        ? prev?.items.at(-1)
        : lastBatchIndex - 1 === batchIndex
        ? prev?.items[0]
        : undefined;
    const { ids, items } = await this.fetchItems(start, end, cursor);
    const groups = this.groupItems?.(items);

    if (
      prev &&
      prev.groups &&
      prev.groups.length > 0 &&
      groups &&
      groups.length > 0
    ) {
      // if user is moving downwards, we hide the first group from the
      // current batch, otherwise we hide the last group from the previous
      // batch.
      const group =
        lastBatchIndex < batchIndex
          ? groups[0] //groups.length - 1]
          : prev.groups[prev.groups.length - 1];
      if (group.group.title === groups[0].group.title) {
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

  private loadBatch(batch: number, operate?: BatchOperator<T>) {
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

  private get last() {
    const keys = Array.from(this.cache.keys());
    return keys[keys.length - 1];
  }

  private isLastBatch(batch: number) {
    return Math.floor(this.ids.length / this.batchSize) === batch;
  }
}
