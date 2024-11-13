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
import { expect } from "detox";
import { notesnook } from "../test.ids";
import { Tests } from "./utils";

async function lockNote() {
  await Tests.fromId(notesnook.listitem.menu).waitAndTap();
  await Tests.sleep(500);
  await Tests.fromId("icon-lock-unlock").waitAndTap();
  await Tests.sleep(500);
  await Tests.fromText("Lock").isVisible();
  await Tests.fromId(notesnook.ids.dialogs.vault.pwd).element.typeText("1234");
  await Tests.fromId(notesnook.ids.dialogs.vault.pwdAlt).element.typeText(
    "1234"
  );
  await Tests.fromText("Lock").waitAndTap();
  await Tests.fromId("note-locked-icon").isVisible();
}

async function removeFromVault() {
  await Tests.fromId(notesnook.listitem.menu).waitAndTap();
  await Tests.sleep(500);
  await Tests.fromId("icon-lock-unlock").waitAndTap();
  await Tests.sleep(500);
  await Tests.fromId(notesnook.ids.dialogs.vault.pwd).element.typeText("1234");
  await Tests.fromText("Unlock").waitAndTap();
  await Tests.fromId("note-locked-icon").isNotVisible();
}

async function openLockedNote(pwd?: string) {
  await Tests.fromId(notesnook.ids.note.get(0)).waitAndTap();
  await Tests.sleep(500);
  await web()
    .element(by.web.name("password"))
    .typeText(pwd || "1234", false);
  await web().element(by.web.className("unlock-note")).tap();
  await Tests.sleep(500);
  await expect(web().element(by.web.className("unlock-note"))).not.toExist();
}

async function goToPrivacySecuritySettings() {
  await Tests.navigate("Settings");
  await Tests.sleep(300);
  await Tests.fromText("Vault").waitAndTap();
}

describe("VAULT", () => {
  it("Create vault from settings", async () => {
    await Tests.prepare();
    await goToPrivacySecuritySettings();
    await Tests.fromText("Create vault").waitAndTap();
    await Tests.fromId(notesnook.ids.dialogs.vault.pwd).element.typeText(
      "1234"
    );
    await Tests.fromId(notesnook.ids.dialogs.vault.pwdAlt).element.typeText(
      "1234"
    );
    await Tests.fromText("Create").waitAndTap();
    await Tests.fromText("Clear vault").isVisible();
  });

  it("Change vault password", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await lockNote();
    await goToPrivacySecuritySettings();
    await Tests.fromText("Change vault password").waitAndTap();
    await Tests.fromId(notesnook.ids.dialogs.vault.pwd).element.typeText(
      "1234"
    );
    await Tests.fromId(notesnook.ids.dialogs.vault.changePwd).element.typeText(
      "2362"
    );
    await Tests.fromText("Change").waitAndTap();
    await device.pressBack();
    await device.pressBack();
    await Tests.sleep(500);
    await openLockedNote("2362");
  });

  it("Delete vault", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await lockNote();
    await goToPrivacySecuritySettings();
    await Tests.fromText("Delete vault").waitAndTap();
    await Tests.fromId(notesnook.ids.dialogs.vault.pwd).element.typeText(
      "1234"
    );
    await Tests.fromText("Delete").waitAndTap();
    await Tests.sleep(300);
    await Tests.fromText("Create vault").isVisible();
    await device.pressBack();
    await device.pressBack();
    await Tests.fromId(notesnook.listitem.menu).isVisible();
  });

  it("Delete vault with locked notes", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await lockNote();
    await goToPrivacySecuritySettings();
    await Tests.fromText("Delete vault").waitAndTap();
    await Tests.fromId(notesnook.ids.dialogs.vault.pwd).element.typeText(
      "1234"
    );
    await Tests.fromText("Delete notes in this vault").waitAndTap();
    await Tests.fromText("Delete").waitAndTap();
    await Tests.sleep(300);
    await Tests.fromText("Create vault").isVisible();
    await device.pressBack();
    await device.pressBack();
    await Tests.fromId(notesnook.listitem.menu).isNotVisible();
  });

  it("Add a note to vault", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await lockNote();
    await openLockedNote();
  });

  it("Remove note from vault", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await lockNote();
    await removeFromVault();
  });
});
