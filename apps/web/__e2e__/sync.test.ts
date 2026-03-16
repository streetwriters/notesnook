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

import { AppModel } from "./models/app.model";
import { USER } from "./utils";
import { test, expect, TestArgs } from "@nn/test";

// run this test file sequentially
test.describe.configure({ mode: "serial" });

async function createDevice(args: { newPage: TestArgs["newPage"] }) {
  const page = await args.newPage?.();
  if (!page) throw new Error("Page not found");
  const app = new AppModel(page);
  await app.auth.goto();
  await app.auth.login(USER.CURRENT);
  await app.waitForSync("synced");

  return app;
}

test.setTimeout(120 * 1000);
test(`content edits in a note opened on 2 devices in multiple tabs should sync in real-time`, async ({
  newPage
}, info) => {
  const NOTE = {
    title: `Note ${makeid(20)}`
  };

  info.setTimeout(120 * 1000);
  const newContent = makeid(24).repeat(2);

  const [deviceA, deviceB] = await Promise.all([
    createDevice({ newPage }),
    createDevice({ newPage })
  ]);

  const [notesA, notesB] = await Promise.all(
    [deviceA, deviceB].map((d) => d.goToNotes())
  );
  const noteB = await notesB.createNote(NOTE);
  await notesA.waitForItem(NOTE.title, 0);
  const noteA = await notesA.findNote({ title: NOTE.title });

  expect(noteA).toBeDefined();
  expect(noteB).toBeDefined();

  await noteA?.openNote();
  await noteA?.openNote(true);

  await expect(notesA.editor.content).toBeEmpty();
  await expect(notesB.editor.content).toBeEmpty();

  await notesA.editor.setContent(newContent);
  await notesB.editor.waitForContent(newContent, 0);

  await expect(notesA.editor.content).toHaveText(newContent);
  await expect(notesB.editor.content).toHaveText(newContent);

  const tabsA = await notesA.editor.getTabs();
  await tabsA[0].click();
  await expect(notesA.editor.content).toHaveText(newContent);

  await (await deviceA.goToSettings())?.logout();
  await (await deviceB.goToSettings())?.logout();
});

test(`title edits in a note opened on 2 devices in multiple tabs should sync in real-time`, async ({
  newPage
}, info) => {
  const NOTE = {
    title: `Note ${makeid(20)}`
  };

  info.setTimeout(120 * 1000);
  const newContent = makeid(24).repeat(2);

  const [deviceA, deviceB] = await Promise.all([
    createDevice({
      newPage
    }),
    createDevice({
      newPage
    })
  ]);

  const [notesA, notesB] = await Promise.all(
    [deviceA, deviceB].map((d) => d.goToNotes())
  );

  const noteB = await notesB.createNote(NOTE);
  await notesA.waitForItem(NOTE.title, 0);
  const noteA = await notesA.findNote({ title: NOTE.title });

  expect(noteA).toBeDefined();
  expect(noteB).toBeDefined();

  await noteA?.openNote();
  await noteA?.openNote(true);

  await expect(notesA.editor.content).toBeEmpty();
  await expect(notesB.editor.content).toBeEmpty();

  await notesA.editor.setTitle(newContent);
  await notesB.editor.waitForTitle(newContent, 0);

  expect(await notesA.editor.getTitle()).toBe(newContent);
  expect(await notesB.editor.getTitle()).toBe(newContent);

  const tabsA = await notesA.editor.getTabs();
  await tabsA[0].click();
  expect(await notesA.editor.getTitle()).toBe(newContent);

  await (await deviceA.goToSettings())?.logout();
  await (await deviceB.goToSettings())?.logout();
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
