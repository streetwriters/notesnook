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

import { describe, expect, test } from "vitest";
import { csvToTable, parseCsv } from "../csv.js";

describe("csv", () => {
  test("parses quoted cells, escaped quotes and CRLF rows", () => {
    expect(
      parseCsv('name,note\r\n"Doe, J","said ""hi"""\r\n\r\nx,\n')
    ).toEqual([
      ["name", "note"],
      ["Doe, J", 'said "hi"'],
      ["x", ""]
    ]);
  });

  test("keeps newlines inside quotes", () => {
    expect(parseCsv('a,"b\nc"')).toEqual([["a", "b\nc"]]);
  });

  test("builds a table with a header row and padded rows", () => {
    const table = csvToTable("a,b\n1");
    expect(table?.type).toBe("table");
    expect(table?.content?.[0].content?.map((cell) => cell.type)).toEqual([
      "tableHeader",
      "tableHeader"
    ]);
    expect(table?.content?.[1].content?.map((cell) => cell.type)).toEqual([
      "tableCell",
      "tableCell"
    ]);
    expect(table?.content?.[1].content?.[0].content?.[0].content?.[0].text).toBe(
      "1"
    );
  });

  test("returns nothing for an empty file", () => {
    expect(csvToTable("")).toBeUndefined();
    expect(csvToTable("\n,\n")).toBeUndefined();
  });
});
