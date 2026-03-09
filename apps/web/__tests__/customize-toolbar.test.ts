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

import {
  Item,
  Group,
  Subgroup,
  TreeNode,
  moveItem
} from "../src/dialogs/settings/components/customize-toolbar";
import { describe, it, expect } from "vitest";

describe("moveItem function", () => {
  it("should correctly set depth when moving item from subgroup to main group", () => {
    const group: Group = {
      type: "group",
      id: "group1",
      title: "Group 1",
      depth: 0
    };

    const subgroup: Subgroup = {
      type: "group",
      id: "subgroup1",
      title: "Subgroup 1",
      depth: 1
    };

    const item: Item = {
      type: "item",
      id: "item1",
      title: "Item 1",
      depth: 2, // currently in subgroup
      toolId: "bold",
      icon: "bold"
    };

    const items: TreeNode[] = [group, subgroup, item];

    // move item from subgroup to main group
    const result = moveItem(items, "item1", "group1");

    // find the moved item
    const movedItem = result.find((i) => i.id === "item1") as Item;

    // the item should now have depth 1 (group depth + 1)
    expect(movedItem.depth).toBe(1);
  });

  it("should correctly set depth when moving item from main group to subgroup", () => {
    const group: Group = {
      type: "group",
      id: "group1",
      title: "Group 1",
      depth: 0
    };

    const item: Item = {
      type: "item",
      id: "item1",
      title: "Item 1",
      depth: 1, // currently in main group
      toolId: "bold",
      icon: "bold"
    };

    const subgroup: Subgroup = {
      type: "group",
      id: "subgroup1",
      title: "Subgroup 1",
      depth: 1
    };

    const items: TreeNode[] = [group, item, subgroup];

    // move item from main group to subgroup
    const result = moveItem(items, "item1", "subgroup1");

    // find the moved item
    const movedItem = result.find((i) => i.id === "item1") as Item;

    // the item should now have depth 2 (subgroup depth + 1)
    expect(movedItem.depth).toBe(2);
  });

  it("should correctly set depth when moving item to another item at same level", () => {
    const group: Group = {
      type: "group",
      id: "group1",
      title: "Group 1",
      depth: 0
    };

    const item1: Item = {
      type: "item",
      id: "item1",
      title: "Item 1",
      depth: 1,
      toolId: "bold",
      icon: "bold"
    };

    const item2: Item = {
      type: "item",
      id: "item2",
      title: "Item 2",
      depth: 1,
      toolId: "italic",
      icon: "italic"
    };

    const items: TreeNode[] = [group, item1, item2];

    // move item1 to item2's position
    const result = moveItem(items, "item1", "item2");

    // find the moved item
    const movedItem = result.find((i) => i.id === "item1") as Item;

    // the item should maintain the same depth as the target item
    expect(movedItem.depth).toBe(1);
  });

  it("should correctly set depth when moving item from subgroup to another subgroup", () => {
    const group: Group = {
      type: "group",
      id: "group1",
      title: "Group 1",
      depth: 0
    };

    const subgroup1: Subgroup = {
      type: "group",
      id: "subgroup1",
      title: "Subgroup 1",
      depth: 1
    };

    const item1: Item = {
      type: "item",
      id: "item1",
      title: "Item 1",
      depth: 2,
      toolId: "bold",
      icon: "bold"
    };

    const subgroup2: Subgroup = {
      type: "group",
      id: "subgroup2",
      title: "Subgroup 2",
      depth: 1
    };

    const items: TreeNode[] = [group, subgroup1, item1, subgroup2];

    // move item from subgroup1 to subgroup2
    const result = moveItem(items, "item1", "subgroup2");

    // find the moved item
    const movedItem = result.find((i) => i.id === "item1") as Item;

    // the item should now have depth 2 (subgroup depth + 1)
    expect(movedItem.depth).toBe(2);
  });
});
