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

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { count, expectDialog, settle } from "./dialogs";
import { launchApp, waitForShellContent } from "./launch";

let app: DesktopApp | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

async function start(args: string[]) {
  app = await launchApp({
    disableAnimations: true,
    timeout: 180000,
    args,
    initialProps: { resetConfig: true },
    env: {
      RN_GPUI_APP_DATA_DIR: mkdtempSync(path.join(tmpdir(), "notesnook-launch-"))
    }
  });
  await waitForShellContent(app);
  return app;
}

describe("launch arguments", () => {
  test("new note opens an editor session", async () => {
    const running = await start(["new", "note"]);
    await settle(async () =>
      expect(await count(running, "editor-title")).toBeGreaterThan(0)
    );
    await settle(async () =>
      expect(await count(running, "tab-title")).toBeGreaterThan(0)
    );
  });

  test("new notebook opens the notebook dialog", async () => {
    const running = await start(["new", "notebook"]);
    await expectDialog(running, "add-notebook-dialog", "New notebook");
  });

  test("new reminder opens the reminder dialog", async () => {
    const running = await start(["new", "reminder"]);
    await expectDialog(running, "add-reminder-dialog");
  });

  test("no arguments opens no dialog", async () => {
    const running = await start([]);
    expect(await count(running, "add-notebook-dialog")).toBe(0);
    expect(await count(running, "add-reminder-dialog")).toBe(0);
  });
});
