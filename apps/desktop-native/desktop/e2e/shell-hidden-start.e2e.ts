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
import { afterEach, expect, test, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { launchApp } from "./launch";

let app: DesktopApp | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

const start = (args: string[]) =>
  launchApp({
    disableAnimations: true,
    timeout: 180000,
    args,
    initialProps: { resetConfig: true },
    env: {
      RN_GPUI_TEST_ON_TOP: "1",
      RN_GPUI_APP_DATA_DIR: mkdtempSync(path.join(tmpdir(), "notesnook-hs-"))
    }
  });

test("the window is shown on the first shell frame and made opaque on a drawn frame", async () => {
  app = await start([]);
  await vi.waitFor(
    async () =>
      expect(await app!.getByTestId("app").count()).toBeGreaterThan(0),
    { timeout: 60000, interval: 200 }
  );
  await vi.waitFor(
    async () => expect((await app!.windowState(1)).isVisible).toBe(true),
    { timeout: 10000, interval: 100 }
  );
  await vi.waitFor(
    async () =>
      expect(await app!.windowReveal()).toEqual({
        alpha: 1,
        revealedBy: "frame"
      }),
    { timeout: 5000, interval: 100 }
  );
});

test("started with --hidden the app renders its shell and keeps the window hidden", async () => {
  app = await start(["--hidden"]);
  await vi.waitFor(
    async () =>
      expect(await app!.getByTestId("app").count()).toBeGreaterThan(0),
    { timeout: 60000, interval: 200 }
  );
  await new Promise((resolve) => setTimeout(resolve, 3000));
  expect((await app.windowState(1)).isVisible).toBe(false);
  expect((await app.windowReveal()).revealedBy).toBeNull();
});
