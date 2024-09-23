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

import { describe, test } from "vitest";
import { PathTree } from "../src/utils/path-tree.js";

test("adding duplicate path should make it unique", (t) => {
  const tree = new PathTree();
  t.expect(tree.add("/home/world/test.txt")).toBe("/home/world/test.txt");
  t.expect(tree.add("/home/world/test.txt")).toBe("/home/world/test_1.txt");
});

test("adding path with same filename as directory shouldn't make it unique", (t) => {
  const tree = new PathTree();
  t.expect(tree.add("/home/world")).toBe("/home/world");
  t.expect(tree.add("/home/world.txt")).toBe("/home/world.txt");
});

test("adding directory with same name as filename shouldn't make it unique", (t) => {
  const tree = new PathTree();
  t.expect(tree.add("/home/world.txt")).toBe("/home/world.txt");
  t.expect(tree.add("/home/world.txt/world.hello")).toBe(
    "/home/world.txt/world.hello"
  );
});

test("different casing in filename", (t) => {
  const tree = new PathTree();
  t.expect(tree.add("/home/woRlD.txt")).toBe("/home/woRlD.txt");
  t.expect(tree.add("/home/world.txt")).toBe("/home/world_1.txt");
});

test("different casing in directory name", (t) => {
  const tree = new PathTree();
  t.expect(tree.add("/home/woRlD/one.txt")).toBe("/home/woRlD/one.txt");
  t.expect(tree.add("/home/world/one.txt")).toBe("/home/world/one_1.txt");
});

test("files with different extensions but same name are unique", (t) => {
  const tree = new PathTree();
  t.expect(tree.add("/home/world.txt")).toBe("/home/world.txt");
  t.expect(tree.add("/home/world.hello")).toBe("/home/world.hello");
});

test("uniquify roots", (t) => {
  const tree = new PathTree();
  t.expect(tree.add("root")).toBe("root");
  t.expect(tree.add("root")).toBe("root_1");
});

test("uniquify directories", (t) => {
  const tree = new PathTree();
  t.expect(tree.add("root/root/hello.txt")).toBe("root/root/hello.txt");
  t.expect(tree.add("root")).toBe("root_1");
  t.expect(tree.add("root/root")).toBe("root/root_1");
});

test("uniquify directories (underscore strategy)", (t) => {
  const tree = new PathTree();
  t.expect(tree.add("root/root/hello.txt")).toBe("root/root/hello.txt");
  t.expect(tree.add("root", "underscore")).toBe("_root");
  t.expect(tree.add("root/root", "underscore")).toBe("root/_root");
});

describe("exists", () => {
  test("roots", (t) => {
    const tree = new PathTree();
    t.expect(tree.add("root")).toBe("root");
    t.expect(tree.add("root")).toBe("root_1");
    t.expect(tree.exists("root")).toBe(true);
    t.expect(tree.exists("root_1")).toBe(true);
  });

  test("files with different extensions but same name", (t) => {
    const tree = new PathTree();
    t.expect(tree.add("/home/world.txt")).toBe("/home/world.txt");
    t.expect(tree.add("/home/world.hello")).toBe("/home/world.hello");
    t.expect(tree.exists("/home/world.txt")).toBe(true);
    t.expect(tree.exists("/home/world.hello")).toBe(true);
  });
});
