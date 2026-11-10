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

import { afterAll, beforeAll, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { settle, start } from "./dialogs";

let app: DesktopApp;

beforeAll(async () => {
  app = await start();
});

afterAll(async () => {
  await app.close();
});

test("a control with a title shows it as a tooltip when hovered", async () => {
  const [button] = await app.query("testID", "editor-zoom", true);
  const top = (await app.menuBarState()).inset;
  await app.mouseMove({
    x: button.frame.x + button.frame.width / 2,
    y: button.frame.y + button.frame.height / 2 + top
  });
  await app.waitForIdle();
  await settle(async () => expect((await app.tooltip()).text).toBeTruthy());
});

test("moving away removes the tooltip", async () => {
  await app.mouseMove({ x: 2, y: 2 });
  await settle(async () => expect((await app.tooltip()).text).toBeFalsy());
});
