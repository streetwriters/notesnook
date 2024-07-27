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

import { Page } from "@playwright/test";
import { downloadAndReadFile, getTestId, uploadFile } from "../utils";
import {
  confirmDialog,
  fillPasswordDialog,
  waitForDialog,
  waitToHaveText
} from "./utils";
import { NavigationMenuModel } from "./navigation-menu.model";

export class SettingsViewModel {
  private readonly page: Page;
  private readonly navigation: NavigationMenuModel;

  constructor(page: Page) {
    this.page = page;
    this.navigation = new NavigationMenuModel(page, "settings-navigation-menu");
  }

  async close() {
    await this.page.locator(getTestId("settings-search")).focus();
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(1000);
  }

  async logout() {
    const item = await this.navigation.findItem("Profile");
    await item?.click();

    const logoutButton = this.page
      .locator(getTestId("setting-logout"))
      .locator("button");

    await logoutButton.click();
    await confirmDialog(this.page.locator(getTestId("confirm-dialog")));

    await this.page
      .locator(getTestId("not-logged-in"))
      .waitFor({ state: "visible" });
  }

  async getRecoveryKey(password: string) {
    const item = await this.navigation.findItem("Profile");
    await item?.click();

    const backupRecoveryKeyButton = this.page
      .locator(getTestId("setting-recovery-key"))
      .locator("button");

    await backupRecoveryKeyButton.click();
    await fillPasswordDialog(this.page, password);

    await waitToHaveText(this.page, "recovery-key");

    const key = await this.page
      .locator(getTestId("recovery-key"))
      .textContent();

    const dialog = this.page.locator(getTestId("recovery-key-dialog"));
    await confirmDialog(dialog);
    return key;
  }

  async isLoggedIn() {
    const item = await this.navigation.findItem("Subscription");
    return !!(await item?.getTitle());
  }

  async isBackupEncryptionEnabled(state: boolean) {
    const encyptBackups = this.page
      .locator(getTestId("setting-encrypt-backups"))
      .locator(
        state ? `input[data-checked="true"]` : `input[data-checked="false"]`
      );
    await encyptBackups.waitFor({ state: "visible" });
    return (await encyptBackups.getAttribute("data-checked")) === "true";
  }

  async toggleBackupEncryption(password?: string) {
    const item = await this.navigation.findItem("Backup & export");
    await item?.click();

    const encyptBackups = this.page
      .locator(getTestId("setting-encrypt-backups"))
      .locator("label");

    await encyptBackups.click();

    if (password) await fillPasswordDialog(this.page, password);
  }

  async createBackup(password?: string) {
    const item = await this.navigation.findItem("Backup & export");
    await item?.click();

    const backupData = this.page
      .locator(getTestId("setting-create-backup"))
      .locator("select");

    if (password) {
      await backupData.selectOption({ value: "partial", label: "Backup" });
      await fillPasswordDialog(this.page, password);
    }

    return await downloadAndReadFile(this.page, backupData, "utf-8");
  }

  async restoreData(filename: string, password?: string) {
    const item = await this.navigation.findItem("Backup & export");
    await item?.click();

    const restoreBackup = this.page
      .locator(getTestId("setting-restore-backup"))
      .locator("button");

    await uploadFile(this.page, restoreBackup, filename);
    if (password) await fillPasswordDialog(this.page, password);

    await waitForDialog(this.page, "Restoring backup");
  }
}
