/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable no-undef */

const { test, expect } = require("@playwright/test");
const { getTestId } = require("./utils");

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(baseURL);
  await page.waitForSelector(getTestId("routeHeader"));
});

function createRoute(key, header) {
  return { buttonId: `navitem-${key}`, header };
}

const routes = [
  createRoute("notes", "Notes"),
  createRoute("notebooks", "Notebooks"),
  createRoute("favorites", "Favorites"),
  createRoute("monographs", "Monographs"),
  createRoute("tags", "Tags"),
  createRoute("trash", "Trash"),
  createRoute("settings", "Settings")
];

for (let route of routes) {
  test(`navigating to ${route.header}`, async ({ page }) => {
    await page.waitForSelector(getTestId(route.buttonId), {
      state: "visible"
    });
    await page.click(getTestId(route.buttonId));
    await expect(page.inputValue(getTestId("routeHeader"))).resolves.toBe(
      route.header
    );
    await page.waitForTimeout(300);
  });
}
