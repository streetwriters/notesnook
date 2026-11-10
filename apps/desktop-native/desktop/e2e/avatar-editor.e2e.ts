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

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { count, settle, start } from "./dialogs";
import { png } from "./png";

let app: DesktopApp;

beforeAll(async () => {
  app = await start({
    openAvatarEditor: { image: `data:image/png;base64,${png(128, 64)}` }
  });
});

afterAll(async () => {
  await app.close();
});

type Node = {
  component: string;
  tag: number;
  testID?: string;
  children?: Node[];
};

async function editor() {
  const [root] = await app.query("testID", "avatar-editor", true);
  return root as {
    tag: number;
    frame: { x: number; y: number; width: number; height: number };
  };
}

async function imageLeft() {
  const found: Node[] = [];
  const walk = (node: Node, inside: boolean) => {
    const now = inside || node.testID === "avatar-editor";
    if (now && node.component === "Image") found.push(node);
    for (const child of node.children ?? []) walk(child, now);
  };
  walk((await app.tree()) as Node, false);
  const props = (await app.getProps(found[0].tag)) as {
    frame: { x: number };
  };
  return props.frame.x;
}

describe("avatar editor", () => {
  test("shows the picture once it is loaded", async () => {
    await settle(async () => expect(await count(app, "avatar-editor")).toBe(1));
    await settle(async () => expect(await imageLeft()).toBeDefined());
  });

  test("dragging pans the picture under the mask and stays inside the crop area", async () => {
    const box = await editor();
    const before = await imageLeft();
    const from = {
      x: box.frame.x + box.frame.width / 2,
      y: box.frame.y + box.frame.height / 2
    };
    await app.mouseMove(from);
    await app.mouseDown(from);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await app.mouseMove({ x: from.x - 20, y: from.y });
    await app.mouseMove({ x: from.x - 40, y: from.y });
    await new Promise((resolve) => setTimeout(resolve, 300));
    await app.mouseUp({ x: from.x - 40, y: from.y });
    await settle(async () =>
      expect(before - (await imageLeft())).toBeGreaterThan(30)
    );
    await app.mouseDown(from);
    await app.mouseMove({ x: from.x - 5000, y: from.y });
    await app.mouseUp({ x: from.x - 5000, y: from.y });
    await settle(async () =>
      expect((await imageLeft()) - box.frame.x).toBeLessThanOrEqual(0.5)
    );
  });
});
