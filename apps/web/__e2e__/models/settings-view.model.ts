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

import { Locator, Page } from "@playwright/test";
import { downloadAndReadFile, getTestId, uploadFile } from "../utils";
import { confirmDialog, fillPasswordDialog, waitToHaveText } from "./utils";

export class SettingsViewModel {
  private readonly page: Page;
  private readonly logoutButton: Locator;
  private readonly accountStatusContainer: Locator;
  private readonly backupRecoveryKeyButton: Locator;
  private readonly backupRestoreContainer: Locator;
  private readonly backupData: Locator;
  private readonly restoreBackup: Locator;
  private readonly encyptBackups: Locator;
  constructor(page: Page) {
    this.page = page;
    this.logoutButton = page.locator(getTestId("settings-logout"));
    this.accountStatusContainer = page.locator(getTestId("account-status"));
    this.backupRecoveryKeyButton = page.locator(
      getTestId("backup-recovery-key")
    );
    this.backupRestoreContainer = page.locator(getTestId("backup-restore"));
    this.backupData = page.locator(getTestId("backup-data"));
    this.restoreBackup = page.locator(getTestId("restore-backup"));
    this.encyptBackups = page.locator(getTestId("encrypt-backups"));
  }

  async logout() {
    await this.logoutButton.click();
    await confirmDialog(this.page);
    await this.page
      .locator(getTestId("not-logged-in"))
      .waitFor({ state: "visible" });
  }

  async getRecoveryKey(password: string) {
    await this.backupRecoveryKeyButton.click();
    await fillPasswordDialog(this.page, password);

    await waitToHaveText(this.page, "recovery-key");

    const key = await this.page
      .locator(getTestId("recovery-key"))
      .textContent();
    await confirmDialog(this.page);
    return key;
  }

  async isLoggedIn() {
    return await this.accountStatusContainer.isVisible();
  }

  async createBackup(password?: string) {
    await this.backupRestoreContainer.click();
    if (password) await this.encyptBackups.click();
    await this.backupData.click();
    if (password) await fillPasswordDialog(this.page, password);
    return await downloadAndReadFile(this.page, this.backupData, "utf-8");
  }

  async restoreData(filename: string, password?: string) {
    await this.backupRestoreContainer.click();
    await this.restoreBackup.click();
    await uploadFile(this.page, this.restoreBackup, filename);
    if (password) await fillPasswordDialog(this.page, password);
  }
}
