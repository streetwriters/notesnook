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

import { notesnook } from "../test.ids";
import {
  tapById,
  elementById,
  visibleByText,
  tapByText,
  createNote,
  prepare,
  visibleById,
  matchSnapshot,
  notVisibleById,
  navigate
} from "./utils";
import { sleep } from "./utils";

async function lockNote() {
  await tapById(notesnook.listitem.menu);
  await tapById("icon-Vault");
  await sleep(1000);
  await visibleByText("Lock");
  await elementById(notesnook.ids.dialogs.vault.pwd).typeText("1234");
  await elementById(notesnook.ids.dialogs.vault.pwdAlt).typeText("1234");
  await tapByText("Lock");
  await sleep(500);
  await visibleById("note-locked-icon");
}

async function removeFromVault() {
  await tapById(notesnook.listitem.menu);
  await tapById("icon-Vault");
  await sleep(1000);
  await elementById(notesnook.ids.dialogs.vault.pwd).typeText("1234");
  await tapByText("Unlock");
  await sleep(1000);
  await notVisibleById("note-locked-icon");
}

async function openLockedNote(pwd) {
  await tapById(notesnook.ids.note.get(1));
  await sleep(1000);
  await visibleByText("Open");
  await elementById(notesnook.ids.dialogs.vault.pwd).typeText(pwd || "1234");
  await tapByText("Open");
  await sleep(3000);
  await matchSnapshot(elementById("editor-wrapper"), "note-after-vault-unlock");
}

async function goToPrivacySecuritySettings() {
  await navigate("Settings");
  await tapByText("Vault");
  await sleep(500);
}

describe("VAULT", () => {
  it("Create vault from settings", async () => {
    await prepare();
    await goToPrivacySecuritySettings();
    await tapByText("Create vault");
    await elementById(notesnook.ids.dialogs.vault.pwd).typeText("1234");
    await elementById(notesnook.ids.dialogs.vault.pwdAlt).typeText("1234");
    await tapByText("Create");
    await sleep(500);
    await visibleByText("Clear vault");
  });

  it("Change vault password", async () => {
    await prepare();
    await createNote();
    await lockNote();
    await goToPrivacySecuritySettings();
    await tapByText("Change vault password");
    await elementById(notesnook.ids.dialogs.vault.pwd).typeText("1234");
    await elementById(notesnook.ids.dialogs.vault.changePwd).typeText("2362");
    await tapByText("Change");
    await device.pressBack();
    await device.pressBack();
    await openLockedNote("2362");
  });

  it("Delete vault", async () => {
    await prepare();
    await createNote();
    await lockNote();
    await goToPrivacySecuritySettings();
    await tapByText("Delete vault");
    await elementById(notesnook.ids.dialogs.vault.pwd).typeText("1234");
    await tapByText("Delete");
    await sleep(500);
    await visibleByText("Create vault");
    await device.pressBack();
    await device.pressBack();
    await visibleById(notesnook.listitem.menu);
  });

  it("Delete vault with locked notes", async () => {
    await prepare();
    await createNote();
    await lockNote();
    await goToPrivacySecuritySettings();
    await tapByText("Delete vault");
    await elementById(notesnook.ids.dialogs.vault.pwd).typeText("1234");
    await tapByText("Delete all notes");
    await tapByText("Delete");
    await sleep(500);
    await visibleByText("Create vault");
    await device.pressBack();
    await device.pressBack();
    await notVisibleById(notesnook.listitem.menu);
  });

  it.only("Add a note to vault", async () => {
    await prepare();
    await createNote();
    await lockNote();
    await openLockedNote();
  });

  it("Remove note from vault", async () => {
    await prepare();
    await createNote();
    await lockNote();
    await removeFromVault();
  });
});
