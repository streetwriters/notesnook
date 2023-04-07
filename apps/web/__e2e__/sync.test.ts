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
import { test, Browser, expect } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { USER } from "./utils";

async function createDevice(browser: Browser) {
  // Create two isolated browser contexts
  const context = await browser.newContext();
  const page = await context.newPage();

  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);
  await app.waitForSync();

  return app;
}

async function actAndSync<T>(
  devices: AppModel[],
  ...actions: (Promise<T> | undefined)[]
) {
  const results = await Promise.all([
    ...actions.filter((a) => !!a),
    ...devices.map((d) => d.waitForSync("synced", "now"))
  ]);

  await Promise.all(devices.map((d) => d.page.waitForTimeout(2000)));
  return results.slice(0, actions.length) as T[];
}

const NOTE = {
  title: "Real-time sync test note 1"
};

test("edits in a note opened on 2 devices should sync in real-time", async ({
  browser
}, info) => {
  info.setTimeout(60 * 1000);
  const newContent = makeid(24).repeat(2);

  const [deviceA, deviceB] = await Promise.all([
    createDevice(browser),
    createDevice(browser)
  ]);
  const [notesA, notesB] = await Promise.all(
    [deviceA, deviceB].map((d) => d.goToNotes())
  );
  const noteB =
    (await notesB.findNote(NOTE)) ||
    (await actAndSync([deviceA, deviceB], notesB.createNote(NOTE)))[0];
  const noteA = await notesA.findNote(NOTE);
  await Promise.all([noteA, noteB].map((note) => note?.openNote()));

  await notesB.editor.clear();
  await actAndSync([deviceA, deviceB], notesB.editor.setContent(newContent));

  const [afterContentA, afterContentB] = await Promise.all(
    [notesA, notesB].map((notes) => notes?.editor.getContent("text"))
  );
  expect(noteA).toBeDefined();
  expect(noteB).toBeDefined();
  expect(afterContentA).toBe(newContent);
  expect(afterContentB).toBe(newContent);
});

function makeid(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
