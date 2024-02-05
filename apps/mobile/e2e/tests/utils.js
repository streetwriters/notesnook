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

import { notesnook } from "../test.ids";
import { readFileSync } from "fs";
import { expect as jestExpect } from "@jest/globals";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { device as _device } from "detox";
jestExpect.extend({ toMatchImageSnapshot });

const sleep = (duration) =>
  new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, duration)
  );

async function LaunchApp() {
  await waitFor(element(by.id(notesnook.ids.default.root)))
    .toBeVisible()
    .withTimeout(500);
}

function elementById(id) {
  return element(by.id(id)).atIndex(0);
}

function elementByText(text) {
  return element(by.text(text)).atIndex(0);
}

async function tapById(id) {
  await elementById(id).tap();
}

async function tapByText(text) {
  await elementByText(text).tap();
}

async function visibleByText(text) {
  await expect(elementByText(text)).toBeVisible();
}

async function visibleById(id) {
  await expect(elementById(id)).toBeVisible();
}

async function notVisibleById(id) {
  await expect(elementById(id)).not.toBeVisible();
}

async function notVisibleByText(text) {
  await expect(elementByText(text)).not.toBeVisible();
}

async function exitEditor() {
  await _device.pressBack();
  await _device.pressBack();
}

async function createNote(_title, _body) {
  let title = _title || "Test note description that ";
  let body =
    _body ||
    "Test note description that is very long and should not fit in text.";
  await tapById(notesnook.buttons.add);
  let webview = web(by.id(notesnook.editor.id));
  await expect(webview.element(by.web.className("ProseMirror"))).toExist();
  await webview.element(by.web.className("ProseMirror")).tap();
  await webview.element(by.web.className("ProseMirror")).typeText(body, true);
  await exitEditor();
  await expect(element(by.text(body))).toBeVisible();

  return { title, body };
}

async function openSideMenu() {
  let menu = elementById(notesnook.ids.default.header.buttons.left);
  await menu.tap();
}

async function navigate(screen) {
  let menu = elementById(notesnook.ids.default.header.buttons.left);
  await waitFor(menu).toBeVisible().withTimeout(300);
  await menu.tap();

  await waitFor(elementByText(screen)).toBeVisible().withTimeout(300);
  await elementByText(screen).tap();
}

const testvars = {
  isFirstTest: true
};

async function prepare() {
  await device.disableSynchronization();
  if (testvars.isFirstTest) {
    testvars.isFirstTest = false;
    return await LaunchApp();
  }
  await device.reverseTcpPort(8081);
  await device.uninstallApp();
  await device.installApp();
  await device.launchApp({ newInstance: true });
  await LaunchApp();
}

async function matchSnapshot(element, name) {
  let path = await element.takeScreenshot(name);
  const bitmapBuffer = readFileSync(path);
  jestExpect(bitmapBuffer).toMatchImageSnapshot({
    failureThreshold: 200,
    failureThresholdType: "pixel"
  });
}

async function createNotebook(title = "Notebook 1", description = true) {
  await elementById(notesnook.ids.dialogs.notebook.inputs.title).typeText(
    title
  );
  if (description) {
    await elementById(
      notesnook.ids.dialogs.notebook.inputs.description
    ).typeText(`Description of ${title}`);
  }
  await tapByText("Add");
  await sleep(300);
}

export {
  matchSnapshot,
  createNotebook,
  prepare,
  LaunchApp,
  createNote,
  navigate,
  openSideMenu,
  notVisibleById,
  notVisibleByText,
  visibleById,
  visibleByText,
  tapById,
  tapByText,
  elementByText,
  elementById,
  sleep,
  exitEditor
};
