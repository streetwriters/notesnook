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

import { formatTitle } from "../title-format.ts";
import MockDate from "mockdate";
import { test, expect, describe, beforeAll, afterAll } from "vitest";

const templates = {
  $time$: "11:25",
  $date$: "DD-MM-YYYY",
  $timestamp$: "DDMMYYYY1125",
  $count$: "1",
  $headline$: "HEADLINE"
};

const cases = [
  ...Object.entries(templates).map(([key, value]) => {
    return [`Note ${key}`, `Note ${value}`];
  })
];

beforeAll(() => {
  MockDate.set("2000-11-22 11:25");
});

afterAll(() => {
  MockDate.reset();
});

describe("pairs should be equal", () => {
  test.each(cases)("%s", (one, two) => {
    expect(formatTitle(one, "[DD-MM-YYYY]", "[hh:mm]", "HEADLINE", 0)).toBe(
      two
    );
  });
});
