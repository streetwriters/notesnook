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

import { DesktopIntegration, PATHS } from "@notesnook/desktop";
import { db } from "../common/db";
import { desktop } from "../common/desktop-bridge";
import createStore from "../common/store";
import Config from "../utils/config";
import BaseStore from "./index";
import { store as editorStore } from "./editor-store";
import { isTelemetryEnabled, setTelemetry } from "../utils/telemetry";
import { setDocumentTitle } from "../utils/dom";
import { TimeFormat } from "@notesnook/core/dist/utils/date";
import { TrashCleanupInterval } from "@notesnook/core";
import { SecurityKeyConfig } from "../utils/webauthn";

type AppLockSettings = {
  enabled: boolean;
  lockAfter: number;
  securityKey?: SecurityKeyConfig;
};

class SettingStore extends BaseStore<SettingStore> {
  encryptBackups = Config.get("encryptBackups", false);
  backupReminderOffset = Config.get("backupReminderOffset", 0);
  backupStorageLocation = Config.get(
    "backupStorageLocation",
    PATHS.backupsDirectory
  );
  doubleSpacedParagraphs = Config.get("doubleSpacedLines", true);
  notificationsSettings = Config.get("notifications", { reminder: true });

  zoomFactor = 1.0;
  privacyMode = false;
  hideNoteTitle = Config.get("hideNoteTitle", false);
  telemetry = isTelemetryEnabled();
  dateFormat = "DD-MM-YYYY";
  timeFormat: TimeFormat = "12-hour";
  titleFormat = "Note $date$ $time$";

  trashCleanupInterval: TrashCleanupInterval = 7;
  homepage = Config.get("homepage", 0);
  desktopIntegrationSettings?: DesktopIntegration;
  autoUpdates = true;
  isFlatpak = false;

  appLockSettings: AppLockSettings = Config.get("appLockSettings", {
    enabled: false,
    lockAfter: 0
  });

  refresh = async () => {
    this.set({
      dateFormat: db.settings.getDateFormat(),
      timeFormat: db.settings.getTimeFormat(),
      titleFormat: db.settings.getTitleFormat(),
      trashCleanupInterval: db.settings.getTrashCleanupInterval(),
      isFlatpak: await desktop?.integration.isFlatpak.query(),
      desktopIntegrationSettings:
        await desktop?.integration.desktopIntegration.query(),
      privacyMode: await desktop?.integration.privacyMode.query(),
      zoomFactor: await desktop?.integration.zoomFactor.query(),
      autoUpdates: await desktop?.updater.autoUpdates.query()
    });
  };

  setDateFormat = async (dateFormat: string) => {
    await db.settings.setDateFormat(dateFormat);
    this.set({ dateFormat });
  };

  setTimeFormat = async (timeFormat: TimeFormat) => {
    await db.settings.setTimeFormat(timeFormat);
    this.set({ timeFormat });
  };

  setTitleFormat = async (titleFormat: string) => {
    await db.settings.setTitleFormat(titleFormat);
    this.set({ titleFormat });
  };

  setTrashCleanupInterval = async (
    trashCleanupInterval: TrashCleanupInterval
  ) => {
    await db.settings.setTrashCleanupInterval(trashCleanupInterval);
    this.set({ trashCleanupInterval });
  };

  setZoomFactor = async (zoomFactor: number) => {
    await desktop?.integration.setZoomFactor.mutate(zoomFactor);
    this.set({ zoomFactor });
  };

  setEncryptBackups = (encryptBackups: boolean) => {
    this.set({ encryptBackups });
    Config.set("encryptBackups", encryptBackups);
  };

  setHomepage = (homepage: number) => {
    this.set({ homepage });
    Config.set("homepage", homepage);
  };

  setDesktopIntegration = async (settings: DesktopIntegration) => {
    const { desktopIntegrationSettings } = this.get();

    await desktop?.integration.setDesktopIntegration.mutate({
      ...desktopIntegrationSettings,
      ...settings
    });
    this.set({
      desktopIntegrationSettings:
        await desktop?.integration.desktopIntegration.query()
    });
  };

  setNotificationSettings = (settings: { reminder: boolean }) => {
    const { notificationsSettings } = this.get();
    Config.set("notifications", { ...notificationsSettings, ...settings });

    this.set({ notificationsSettings: Config.get("notifications") });
  };

  setAppLockSettings = (settings: Partial<AppLockSettings>) => {
    const { appLockSettings } = this.get();
    Config.set("appLockSettings", { ...appLockSettings, ...settings });
    this.set({ appLockSettings: Config.get("appLockSettings") });
  };

  toggleEncryptBackups = () => {
    const encryptBackups = this.get().encryptBackups;
    this.setEncryptBackups(!encryptBackups);
  };

  setBackupReminderOffset = (offset: number) => {
    Config.set("backupReminderOffset", offset);
    this.set({ backupReminderOffset: offset });
  };

  setBackupStorageLocation = (location: string) => {
    Config.set("backupStorageLocation", location);
    this.set({ backupStorageLocation: location });
  };

  toggleDoubleSpacedParagraphs = () => {
    const doubleSpacedParagraphs = this.get().doubleSpacedParagraphs;
    this.set(
      (state) => (state.doubleSpacedParagraphs = !doubleSpacedParagraphs)
    );
    Config.set("doubleSpacedLines", !doubleSpacedParagraphs);
  };

  toggleTelemetry = () => {
    const telemetry = this.get().telemetry;
    this.set({ telemetry: !telemetry });
    setTelemetry(!telemetry);
  };

  togglePrivacyMode = async () => {
    const privacyMode = this.get().privacyMode;
    this.set({ privacyMode: !privacyMode });
    await desktop?.integration.setPrivacyMode.mutate({ enabled: !privacyMode });
  };

  toggleHideTitle = async () => {
    const { hideNoteTitle } = this.get();
    this.set({ hideNoteTitle: !hideNoteTitle });
    Config.set("hideNoteTitle", !hideNoteTitle);
    setDocumentTitle(
      !hideNoteTitle ? undefined : editorStore.get().session.title
    );
  };

  toggleAutoUpdates = async () => {
    const autoUpdates = this.get().autoUpdates;
    this.set({ autoUpdates: !autoUpdates });
    await desktop?.updater.toggleAutoUpdates.mutate({ enabled: !autoUpdates });
  };
}

const [useStore, store] = createStore(SettingStore);
export { useStore, store };
