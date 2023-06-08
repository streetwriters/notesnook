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

import setDesktopIntegration from "../commands/set-desktop-integration";
import { db } from "../common/db";
import createStore from "../common/store";
import Config from "../utils/config";
import BaseStore from "./index";

/**
 * @extends {BaseStore<SettingStore>}
 */
class SettingStore extends BaseStore {
  encryptBackups = Config.get("encryptBackups", false);
  doubleSpacedLines = Config.get("doubleSpacedLines", true);
  notificationsSettings = Config.get("notifications", { reminder: true });

  /** @type {string} */
  dateFormat = null;
  /** @type {"12-hour" | "24-hour"} */
  timeFormat = null;
  titleFormat = null;
  /** @type {number} */
  trashCleanupInterval = null;
  homepage = Config.get("homepage", 0);
  /**
   * @type {DesktopIntegrationSettings | undefined}
   */
  desktopIntegrationSettings = undefined;

  refresh = async () => {
    this.set({
      dateFormat: db.settings.getDateFormat(),
      timeFormat: db.settings.getTimeFormat(),
      titleFormat: db.settings.getTitleFormat(),
      trashCleanupInterval: db.settings.getTrashCleanupInterval(),
      desktopIntegrationSettings: await window.config?.desktopIntegration()
    });
  };

  setDateFormat = async (dateFormat) => {
    await db.settings.setDateFormat(dateFormat);
    this.set({ dateFormat });
  };

  setTimeFormat = async (timeFormat) => {
    await db.settings.setTimeFormat(timeFormat);
    this.set({ timeFormat });
  };

  setTitleFormat = async (titleFormat) => {
    await db.settings.setTitleFormat(titleFormat);
    this.set({ titleFormat });
  };

  setTrashCleanupInterval = async (trashCleanupInterval) => {
    await db.settings.setTrashCleanupInterval(trashCleanupInterval);
    this.set({ trashCleanupInterval });
  };

  setEncryptBackups = (encryptBackups) => {
    this.set({ encryptBackups });
    Config.set("encryptBackups", encryptBackups);
  };

  setHomepage = (homepage) => {
    this.set({ homepage });
    Config.set("homepage", homepage);
  };

  /**
   *
   * @param {Partial<DesktopIntegrationSettings>} settings
   */
  setDesktopIntegration = async (settings) => {
    const { desktopIntegrationSettings } = this.get();

    setDesktopIntegration({ ...desktopIntegrationSettings, ...settings });
    this.set({
      desktopIntegrationSettings: await window.config?.desktopIntegration()
    });
  };

  setNotificationSettings = (settings) => {
    const { notificationsSettings } = this.get();
    Config.set("notifications", { ...notificationsSettings, ...settings });

    this.set({ notificationsSettings: Config.get("notifications") });
  };

  toggleEncryptBackups = () => {
    const encryptBackups = this.get().encryptBackups;
    this.setEncryptBackups(!encryptBackups);
  };

  toggleDoubleSpacedLines = () => {
    const doubleSpacedLines = this.get().doubleSpacedLines;
    this.set((state) => (state.doubleSpacedLines = !doubleSpacedLines));
    Config.set("doubleSpacedLines", !doubleSpacedLines);
  };
}

const [useStore, store] = createStore(SettingStore);
export { useStore, store };
