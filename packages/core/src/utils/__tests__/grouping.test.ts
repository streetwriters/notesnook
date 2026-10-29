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
import { groupArray } from "../grouping.js";

describe("groupArray", () => {
  const items = [
    "Upcoming",
    "Past",
    "Upcoming",
    "Completed",
    "Past",
    "Upcoming"
  ];
  const keySelector = (item: string) => item;

  test("counts repeated keys and preserves each group's first index", () => {
    const groups = groupArray(items, keySelector, true);

    expect(Array.from(groups)).toStrictEqual([
      [
        0,
        {
          index: 0,
          group: { id: "Upcoming", title: "Upcoming", type: "header", count: 3 }
        }
      ],
      [
        1,
        {
          index: 1,
          group: { id: "Past", title: "Past", type: "header", count: 2 }
        }
      ],
      [
        3,
        {
          index: 3,
          group: {
            id: "Completed",
            title: "Completed",
            type: "header",
            count: 1
          }
        }
      ]
    ]);
  });

  test.each([undefined, false])(
    "omits counts when includeCounts is %s",
    (includeCounts) => {
      const groups = groupArray(items, keySelector, includeCounts);

      expect(Array.from(groups.keys())).toEqual([0, 1, 3]);
      expect(Array.from(groups.values(), ({ group }) => group.title)).toEqual([
        "Upcoming",
        "Past",
        "Completed"
      ]);
      for (const { group } of groups.values()) {
        expect(group).not.toHaveProperty("count");
      }
    }
  );
});
