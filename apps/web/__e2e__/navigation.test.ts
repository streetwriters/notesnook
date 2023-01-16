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

/* eslint-disable no-undef */
import { test, expect } from "@playwright/test";
import { AppModel } from "./models/app.model";

function createRoute(key: string, header: string) {
  return { buttonId: `navitem-${key}`, header };
}

const routes = [
  createRoute("notes", "Notes"),
  createRoute("notebooks", "Notebooks"),
  createRoute("favorites", "Favorites"),
  createRoute("monographs", "Monographs"),
  createRoute("reminders", "Reminders"),
  createRoute("tags", "Tags"),
  createRoute("trash", "Trash"),
  createRoute("settings", "Settings")
];

for (const route of routes) {
  test(`navigating to ${route.header}`, async ({ page }) => {
    const app = new AppModel(page);
    await app.goto();

    await app.navigateTo(route.header);

    expect(await app.getRouteHeader()).toBe(route.header);
  });
}
