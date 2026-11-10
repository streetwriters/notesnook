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
import { parseLaunchArgs } from "./launch-args";

describe("launch arguments", () => {
  test("new note, notebook and reminder", () => {
    for (const item of ["note", "notebook", "reminder"] as const)
      expect(parseLaunchArgs(["new", item]).request).toEqual({
        type: "create",
        item
      });
  });

  test("open a note by id, with a space or an equals sign", () => {
    expect(parseLaunchArgs(["open", "note", "--id", "abc"]).request).toEqual({
      type: "open",
      item: "note",
      id: "abc"
    });
    expect(parseLaunchArgs(["open", "note", "--id=abc"]).request).toEqual({
      type: "open",
      item: "note",
      id: "abc"
    });
  });

  test("the hidden flag is read on its own and with a request", () => {
    expect(parseLaunchArgs(["--hidden"])).toEqual({ hidden: true });
    expect(parseLaunchArgs(["new", "note", "--hidden"]).hidden).toBe(true);
  });

  test("unknown input and a missing id give no request", () => {
    expect(parseLaunchArgs([]).request).toBe(undefined);
    expect(parseLaunchArgs(["open", "note"]).request).toBe(undefined);
    expect(parseLaunchArgs(["new", "folder"]).request).toBe(undefined);
    expect(parseLaunchArgs(["nn://x"]).request).toBe(undefined);
  });
});
