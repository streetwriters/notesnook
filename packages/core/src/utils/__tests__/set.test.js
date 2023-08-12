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

import Set from "../set";
import { test, expect } from "vitest";

test("union", () => {
  expect(Set.union([1, 2, 2], [2, 3])).toStrictEqual([1, 2, 3]);
});

test("intersection", () => {
  expect(Set.intersection([1, 1, 2], [2, 2, 3])).toStrictEqual([2]);
});

test("difference", () => {
  expect(Set.difference([1, 1, 2], [2, 3, 3])).toStrictEqual([1, 3]);
});

test("complement", () => {
  expect(Set.complement([2, 2, 4], [2, 2, 3])).toStrictEqual([4]);
});

test("equals", () => {
  expect(Set.equals([1, 1, 2], [1, 1, 2])).toBe(true);
});

test("not equals", () => {
  expect(Set.equals([1, 1, 2], [1, 5, 2])).toBe(false);
});
