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

import { test, vi } from "vitest";
import { VirtualizedGrouping } from "../virtualized-grouping";

function item<T>(value: T) {
  return { item: value };
}
function createMock() {
  return vi.fn(async (ids: string[]) =>
    Object.fromEntries(ids.map((id) => [id, id]))
  );
}
test("fetch items in batch if not found in cache", async (t) => {
  const mocked = createMock();
  const grouping = new VirtualizedGrouping<string>(
    ["1", "2", "3", "4", "5", "6", "7"],
    3,
    mocked
  );
  t.expect(await grouping.item("4")).toStrictEqual(item("4"));
  t.expect(mocked).toHaveBeenCalledOnce();
});

test("do not fetch items in batch if found in cache", async (t) => {
  const mocked = createMock();
  const grouping = new VirtualizedGrouping<string>(
    ["1", "2", "3", "4", "5", "6", "7"],
    3,
    mocked
  );
  t.expect(await grouping.item("4")).toStrictEqual(item("4"));
  t.expect(await grouping.item("4")).toStrictEqual(item("4"));
  t.expect(await grouping.item("4")).toStrictEqual(item("4"));
  t.expect(await grouping.item("4")).toStrictEqual(item("4"));
  t.expect(await grouping.item("4")).toStrictEqual(item("4"));
  t.expect(mocked).toHaveBeenCalledOnce();
});

test("clear old cached batches", async (t) => {
  const mocked = createMock();
  const grouping = new VirtualizedGrouping<string>(
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    3,
    mocked
  );
  t.expect(await grouping.item("1")).toStrictEqual(item("1"));
  t.expect(mocked).toHaveBeenLastCalledWith(["1", "2", "3"]);
  t.expect(await grouping.item("4")).toStrictEqual(item("4"));
  t.expect(mocked).toHaveBeenLastCalledWith(["4", "5", "6"]);
  t.expect(await grouping.item("7")).toStrictEqual(item("7"));
  t.expect(mocked).toHaveBeenLastCalledWith(["7", "8", "9"]);
  t.expect(await grouping.item("1")).toStrictEqual(item("1"));
  t.expect(mocked).toHaveBeenLastCalledWith(["1", "2", "3"]);
});

test("clear old cached batches (random access)", async (t) => {
  const mocked = createMock();
  const grouping = new VirtualizedGrouping<string>(
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    3,
    mocked
  );
  t.expect(await grouping.item("1")).toStrictEqual(item("1"));
  t.expect(mocked).toHaveBeenLastCalledWith(["1", "2", "3"]);

  t.expect(await grouping.item("7")).toStrictEqual(item("7"));
  t.expect(mocked).toHaveBeenLastCalledWith(["7", "8", "9"]);

  t.expect(await grouping.item("11")).toStrictEqual(item("11"));
  t.expect(mocked).toHaveBeenLastCalledWith(["10", "11", "12"]);

  t.expect(await grouping.item("1")).toStrictEqual(item("1"));
  t.expect(mocked).toHaveBeenLastCalledWith(["1", "2", "3"]);

  t.expect(await grouping.item("7")).toStrictEqual(item("7"));
  t.expect(mocked).toHaveBeenLastCalledWith(["7", "8", "9"]);
});

test("reloading ids should clear all cached batches", async (t) => {
  const mocked = createMock();
  const grouping = new VirtualizedGrouping<string>(
    ["1", "3", "4", "5", "7", "6", "50"],
    3,
    mocked
  );

  t.expect(await grouping.item("1")).toStrictEqual(item("1"));
  t.expect(mocked).toHaveBeenLastCalledWith(["1", "3", "4"]);

  grouping.refresh([
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12"
  ]);

  t.expect(await grouping.item("1")).toStrictEqual(item("1"));
  t.expect(mocked).toHaveBeenLastCalledWith(["1", "2", "3"]);
});
