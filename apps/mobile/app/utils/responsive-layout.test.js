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

import assert from "node:assert/strict";
import test from "node:test";
import {
  computePaneLayout,
  resolveDeviceMode,
  windowConstrainedSize
} from "./responsive-layout.js";

test("a tablet-sized fold in a narrow pop-up uses one column", () => {
  assert.equal(
    resolveDeviceMode({
      windowWidth: 360,
      isTabletDevice: true,
      isLandscape: false
    }),
    "mobile"
  );
  assert.equal(
    resolveDeviceMode({
      windowWidth: 599,
      isTabletDevice: true,
      isLandscape: true
    }),
    "mobile"
  );
});

test("an unfolded fold keeps two panes in portrait and three in a wide landscape", () => {
  assert.equal(
    resolveDeviceMode({
      windowWidth: 820,
      isTabletDevice: true,
      isLandscape: false
    }),
    "smallTablet"
  );
  assert.equal(
    resolveDeviceMode({
      windowWidth: 980,
      isTabletDevice: true,
      isLandscape: true
    }),
    "tablet"
  );
});

test("phones stay one column in portrait and two columns in a wide landscape", () => {
  assert.equal(
    resolveDeviceMode({
      windowWidth: 390,
      isTabletDevice: false,
      isLandscape: false
    }),
    "mobile"
  );
  assert.equal(
    resolveDeviceMode({
      windowWidth: 844,
      isTabletDevice: false,
      isLandscape: true
    }),
    "smallTablet"
  );
  assert.equal(
    resolveDeviceMode({
      windowWidth: 844,
      isTabletDevice: false,
      isLandscape: false
    }),
    "mobile"
  );
});

test("visible panes fit inside the window", () => {
  for (const width of [320, 360, 480, 600, 720, 840, 1100, 1280]) {
    for (const mode of ["mobile", "smallTablet", "tablet"]) {
      const { widths } = computePaneLayout(mode, width, false);
      if (mode === "tablet") {
        const sum = widths.sidebar + widths.list + widths.editor;
        assert.ok(Math.abs(sum - width) < 0.01, `${mode} ${width} sum ${sum}`);
      } else {
        const visible =
          widths.list + (mode === "smallTablet" ? widths.editor : 0);
        assert.ok(
          visible <= width + 0.01,
          `${mode} ${width} visible ${visible}`
        );
        assert.ok(widths.editor >= 0);
        assert.ok(widths.list <= width + 0.01);
      }
    }
  }
});

test("small-tablet fullscreen gives the editor the whole window", () => {
  const layout = computePaneLayout("smallTablet", 800, true);
  assert.equal(layout.widths.editor, 800);
  assert.equal(layout.offsets.editor, 0);
});

test("window size wins only when it is materially smaller than the view", () => {
  assert.equal(windowConstrainedSize(0, 840), 840);
  assert.equal(windowConstrainedSize(840, 360), 360);
  assert.equal(windowConstrainedSize(400, 390), 400);
  assert.equal(windowConstrainedSize(420, 800), 420);
  assert.equal(windowConstrainedSize(Number.NaN, 400), 400);
});
