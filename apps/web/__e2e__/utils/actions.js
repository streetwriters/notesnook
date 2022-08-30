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
const { getTestId } = require("./index");
const Menu = require("./menuitemidbuilder");

async function navigateTo(pageId) {
  await page.click(Menu.new("navitem").item(pageId).build());
}

async function clickMenuItem(itemId) {
  await page.click(Menu.new("menuitem").item(itemId).build(), {
    button: "left",
    force: true
  });
}

async function openContextMenu(selector) {
  await page.click(selector, { button: "right" });
}

async function closeContextMenu() {
  await page.keyboard.press("Escape");
}

async function useContextMenu(selector, action, close = false) {
  await openContextMenu(selector);

  await action();

  if (close) await closeContextMenu();
}

async function confirmDialog() {
  await page.click(getTestId("dialog-yes"));
}

module.exports = {
  navigateTo,
  clickMenuItem,
  openContextMenu,
  confirmDialog,
  closeContextMenu,
  useContextMenu
};
