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

import { db } from "../../../common/database";
import { ToastManager } from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { useSettingStore } from "../../../stores/use-setting-store";
import { MenuItemsList } from "../../../utils/menu-items";
import { createSettingsPicker } from ".";
import { getFontById, getFonts } from "@notesnook/editor/dist/utils/font";
import { DATE_FORMATS, TIME_FORMATS } from "@notesnook/core/dist/common";
import dayjs from "dayjs";
import { useUserStore } from "../../../stores/use-user-store";
import { verifyUserWithApplock } from "../functions";

export const FontPicker = createSettingsPicker({
  getValue: () => useSettingStore.getState().settings.defaultFontFamily,
  updateValue: (item) => {
    console.log(item.id);
    SettingsService.set({
      defaultFontFamily: item.id
    });
  },
  formatValue: (item) => {
    return getFontById(typeof item === "object" ? item.id : item).title;
  },
  getItemKey: (item) => item.id,
  options: getFonts(),
  compareValue: (current, item) => current === item.id
});

export const HomePicker = createSettingsPicker({
  getValue: () => useSettingStore.getState().settings.homepage,
  updateValue: (item) => {
    SettingsService.set({ homepage: item.name });
    ToastManager.show({
      heading: "Homepage set to " + item.name,
      message: "Restart the app for changes to take effect.",
      type: "success"
    });
  },
  formatValue: (item) => {
    return typeof item === "object" ? item.name : item;
  },
  getItemKey: (item) => item.name,
  options: MenuItemsList.slice(0, MenuItemsList.length - 1),
  compareValue: (current, item) => current === item.name,
  premium: true
});

export const TrashIntervalPicker = createSettingsPicker({
  getValue: () => db.settings.getTrashCleanupInterval(),
  updateValue: (item) => {
    db.settings.setTrashCleanupInterval(item);
  },
  formatValue: (item) => {
    return item === -1 ? "Never" : item === 1 ? "Daily" : item + " days";
  },
  getItemKey: (item) => item.toString(),
  options: [-1, 1, 7, 30, 365],
  compareValue: (current, item) => current === item,
  premium: true
});

export const DateFormatPicker = createSettingsPicker({
  getValue: () => db.settings.getDateFormat(),
  updateValue: (item) => {
    db.settings.setDateFormat(item);
    useSettingStore.setState({
      dateFormat: item
    });
  },
  formatValue: (item) => {
    return `${item} (${dayjs().format(item)})`;
  },
  getItemKey: (item) => item,
  options: DATE_FORMATS,
  compareValue: (current, item) => current === item
});

const TimeFormats = {
  "12-hour": "hh:mm A",
  "24-hour": "HH:mm"
};

export const TimeFormatPicker = createSettingsPicker({
  getValue: () => db.settings.getTimeFormat(),
  updateValue: (item) => {
    db.settings.setTimeFormat(item);
    useSettingStore.setState({
      timeFormat: item
    });
  },
  formatValue: (item) => {
    return `${item} (${dayjs().format(TimeFormats[item])})`;
  },
  getItemKey: (item) => item,
  options: TIME_FORMATS,
  compareValue: (current, item) => current === item
});

export const BackupReminderPicker = createSettingsPicker({
  getValue: () => useSettingStore.getState().settings.reminder,
  updateValue: (item) => {
    SettingsService.set({ reminder: item });
  },
  formatValue: (item) => {
    return item === "useroff"
      ? "Never"
      : item.slice(0, 1).toUpperCase() + item.slice(1);
  },
  getItemKey: (item) => item,
  options: ["useroff", "daily", "weekly", "monthly"],
  compareValue: (current, item) => current === item,
  premium: true,
  requiresVerification: () => {
    return (
      !useSettingStore.getState().settings.encryptedBackup &&
      useUserStore.getState().user
    );
  },
  onCheckOptionIsPremium: (item) => {
    return item !== "useroff";
  }
});

export const ApplockTimerPicker = createSettingsPicker({
  getValue: () => useSettingStore.getState().settings.appLockTimer,
  updateValue: (item) => {
    SettingsService.set({ appLockTimer: item });
  },
  formatValue: (item) => {
    return item === -1
      ? "Never"
      : item === 0 || item === undefined
      ? "Immediately"
      : item === 1
      ? "1 minute"
      : item + " minutes";
  },
  getItemKey: (item) => item.toString(),
  options: [-1, 0, 1, 5, 15, 30],
  compareValue: (current, item) => current === item,
  onVerify: () => {
    return verifyUserWithApplock();
  }
});
