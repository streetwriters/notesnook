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

import { test } from "vitest";
import { VirtualizedGrouping } from "../virtualized-grouping.js";
import { groupArray } from "../grouping.js";

function generateItems(length: number, groupSize: number) {
  const items: { group: string; id: string }[] = [];
  const ids: string[] = [];
  const divider = length / groupSize;
  for (let i = 0; i < length; ++i) {
    items.push({ group: `${i % divider}`, id: `${i}` });
    ids.push(`${i}`);
  }
  items.sort((a, b) => a.group.localeCompare(b.group));
  return { items, ids };
}

function createVirtualizedGrouping(
  length: number,
  groupSize: number,
  batchSize: number
) {
  const { ids, items } = generateItems(length, groupSize);
  return new VirtualizedGrouping<{ group: string; id: string }>(
    items.length,
    batchSize,
    () => Promise.resolve(ids),
    async (start, end) => ({
      ids: ids.slice(start, end),
      items: items.slice(start, end)
    }),
    (items) => groupArray(items, (item) => item.group)
  );
}

test("load first batch with a single group", async (t) => {
  const grouping = createVirtualizedGrouping(100, 10, 10);

  t.expect((await grouping.item(0)).group?.title).toBe("0");
  for (let i = 1; i < 10; ++i)
    t.expect(grouping.cacheItem(i)?.group?.title).toBeUndefined();
});

test("load first batch with a multiple groups", async (t) => {
  const grouping = createVirtualizedGrouping(100, 2, 10);

  t.expect((await grouping.item(0)).group?.title).toBe(`0`);
  t.expect(grouping.cacheItem(2)?.group?.title).toBe(`1`);
  t.expect(grouping.cacheItem(4)?.group?.title).toBe(`10`);
  t.expect(grouping.cacheItem(6)?.group?.title).toBe(`11`);
  t.expect(grouping.cacheItem(8)?.group?.title).toBe(`12`);
});

test("load last batch with a single group", async (t) => {
  const grouping = createVirtualizedGrouping(100, 10, 10);

  t.expect((await grouping.item(90)).group?.title).toBe("9");
  for (let i = 91; i < 100; ++i)
    t.expect(grouping.cacheItem(i)?.group?.title).toBeUndefined();
});

test("load last batch with a multiple groups", async (t) => {
  const grouping = createVirtualizedGrouping(100, 2, 10);

  t.expect((await grouping.item(90)).group?.title).toBe(`5`);
  t.expect(grouping.cacheItem(92)?.group?.title).toBe(`6`);
  t.expect(grouping.cacheItem(94)?.group?.title).toBe(`7`);
  t.expect(grouping.cacheItem(96)?.group?.title).toBe(`8`);
  t.expect(grouping.cacheItem(98)?.group?.title).toBe(`9`);
});

test("group spanning multiple batches (down)", async (t) => {
  const grouping = createVirtualizedGrouping(140, 14, 10);

  t.expect((await grouping.item(0)).group?.title).toBe(`0`);
  t.expect((await grouping.item(12)).group).toBeUndefined();
  t.expect((await grouping.item(14)).group?.title).toBe("1");
  t.expect((await grouping.item(24)).group).toBeUndefined();
  t.expect((await grouping.item(28)).group?.title).toBe("2");
});

test("single group in all batches", async (t) => {
  const grouping = createVirtualizedGrouping(100, 100, 10);

  t.expect((await grouping.item(0)).group?.title).toBe(`0`);
  for (let i = 1; i < 100; ++i) {
    t.expect((await grouping.item(i)).group).toBeUndefined();
  }
});

test("group at start of each batch", async (t) => {
  const grouping = createVirtualizedGrouping(100, 10, 10);

  for (let i = 0; i < 100; i += 10) {
    t.expect((await grouping.item(i)).group?.title).toBe(`${i / 10}`);
  }
});

test("group spanning multiple batches (up)", async (t) => {
  const grouping = createVirtualizedGrouping(140, 28, 10);

  t.expect((await grouping.item(130)).group).toBeUndefined();
  t.expect((await grouping.item(120)).group).toBeUndefined();
  t.expect((await grouping.item(140 - 28)).group).toBeDefined();
  t.expect((await grouping.item(110)).group).toBeUndefined();
});
