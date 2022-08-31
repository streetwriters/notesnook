/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

const { test } = require("@playwright/test");
const { getTestId } = require("./utils");
const { useContextMenu, clickMenuItem } = require("./utils/actions");
const { createNoteAndCheckPresence } = require("./utils/conditions");
const Menu = require("./utils/menuitemidbuilder");

// test.skip(
//   "TODO: make sure to navigate to home if there are 0 notes in a color"
// );

/**
 * @type {import("@playwright/test").Page}
 */
var page = null;
global.page = null;

test.beforeEach(async ({ page: _page, baseURL }) => {
  global.page = _page;
  page = _page;
  await page.goto(baseURL);
  await page.waitForSelector(getTestId("routeHeader"));
});

test("delete the last note of a color", async ({ page }) => {
  const noteSelector = await createNoteAndCheckPresence();

  await useContextMenu(noteSelector, async () => {
    await clickMenuItem("colors");
    await clickMenuItem("red");
  });

  const navItem = new Menu("navitem").item("red").build();
  await page.waitForSelector(navItem);

  await useContextMenu(noteSelector, async () => {
    await clickMenuItem("movetotrash");
  });

  await page.click(new Menu("navitem").item("trash").build());
});
