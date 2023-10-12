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

export type VirtualizedGroupHeader = {
  title: string;
  id: string;
};
export class VirtualizedGrouping<T> {
  private cache: Map<number, Record<string, T>> = new Map();
  private groups: Map<number, VirtualizedGroupHeader[]> = new Map();

  constructor(
    public ids: string[],
    private readonly batchSize: number,
    private readonly fetchItems: (ids: string[]) => Promise<Record<string, T>>,
    private readonly groupItems: (
      ids: string[],
      items: Record<string, T>
    ) => VirtualizedGroupHeader[] = () => []
  ) {
    this.ids = ids;
  }

  /**
   * Get item from cache or request the appropriate batch for caching
   * and load it from there.
   */
  async item(id: string) {
    const index = this.ids.indexOf(id);
    if (index <= -1) return;

    const batchIndex = Math.floor(index / this.batchSize);
    const batch = this.cache.get(batchIndex) || (await this.load(batchIndex));
    const groups = this.groups.get(batchIndex);

    const group = groups?.find((g) => g.id === id);
    if (group)
      return {
        group: { type: "header", id: group.title, title: group.title },
        item: batch[id]
      };
    return { item: batch[id] };
  }

  /**
   * Reload the cache
   */
  refresh(ids: string[]) {
    this.ids = ids;
    this.cache.clear();
  }

  /**
   *
   * @param index
   */
  private async load(batch: number) {
    const start = batch * this.batchSize;
    const end = start + this.batchSize;
    const batchIds = this.ids.slice(start, end);
    const items = await this.fetchItems(batchIds);
    const groups = this.groupItems(batchIds, items);

    const lastBatchIndex = this.last;
    const prevGroups = this.groups.get(lastBatchIndex);
    if (prevGroups && prevGroups.length > 0 && groups.length > 0) {
      const lastGroup = prevGroups[prevGroups.length - 1];
      if (lastGroup.title === groups[0].title) {
        // if user is moving downwards, we remove the last group from the
        // current batch, otherwise we remove the first group from the previous
        // batch.
        lastBatchIndex < batch ? groups.pop() : prevGroups.shift();
      }
    }

    this.cache.set(batch, items);
    this.groups.set(batch, groups);
    this.clear();
    return items;
  }

  private clear() {
    if (this.cache.size <= 2) return;
    for (const [key] of this.cache) {
      this.cache.delete(key);
      this.groups.delete(key);
      if (this.cache.size === 2) break;
    }
  }

  private get last() {
    const keys = Array.from(this.cache.keys());
    return keys[keys.length - 1];
  }
}
