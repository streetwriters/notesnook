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

import { DATE_FORMATS, TIME_FORMATS } from "@notesnook/core";
import { getFontById, getFonts } from "@notesnook/editor/dist/cjs/utils/font";
import dayjs from "dayjs";
import { createSettingsPicker } from ".";
import { db } from "../../../common/database";
import { ToastManager } from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { useSettingStore } from "../../../stores/use-setting-store";
import { useUserStore } from "../../../stores/use-user-store";
import { MenuItemsList } from "../../../utils/menu-items";
import { verifyUserWithApplock } from "../functions";
import { strings } from "@notesnook/intl";
import { isFeatureAvailable } from "@notesnook/common";
import PaywallSheet from "../../../components/sheets/paywall";

export const FontPicker = createSettingsPicker({
  getValue: () => useSettingStore.getState().settings.defaultFontFamily,
  updateValue: (item) => {
    SettingsService.set({
      defaultFontFamily: item.id
    });
  },
  formatValue: (item) => {
    return getFontById(typeof item === "object" ? item.id : item).title;
  },
  getItemKey: (item) => item.id,
  options: getFonts(),
  compareValue: (current, item) => current === item.id,
  isFeatureAvailable: () => true,
  isOptionAvailable: () => true
});

export const HomePicker = createSettingsPicker({
  getValue: () => useSettingStore.getState().settings.homepage,
  updateValue: (item) => {
    SettingsService.set({ homepage: item.title });
    ToastManager.show({
      heading: strings.homePageChangedTo(item.title),
      message: strings.restartAppToApplyChanges(),
      type: "success"
    });
  },
  formatValue: (item) => {
    return strings.routes[typeof item === "object" ? item.title : item]?.();
  },
  getItemKey: (item) => item.title,
  options: MenuItemsList.slice(0, MenuItemsList.length - 1),
  compareValue: (current, item) => current === item.title,
  isFeatureAvailable: () => true,
  isOptionAvailable: () => true
});

export const SidebarTabPicker = createSettingsPicker({
  getValue: () => useSettingStore.getState().settings.defaultSidebarTab,
  updateValue: (item) => {
    SettingsService.set({ defaultSidebarTab: item });
  },
  formatValue: (item) => {
    const SidebarTabs = [
      strings.routes.Home(),
      strings.routes.Notebooks(),
      strings.routes.Tags()
    ];
    return SidebarTabs[item];
  },
  getItemKey: (item) => item,
  options: [0, 1, 2],
  compareValue: (current, item) => current === item,
  isFeatureAvailable: async () => {
    const result = await isFeatureAvailable("defaultSidebarTab");
    if (!result.isAllowed) {
      ToastManager.show({
        message: result.error,
        type: "info",
        actionText: strings.upgrade(),
        func: () => {
          PaywallSheet.present(result);
        }
      });
    }
    return result.isAllowed;
  },
  isOptionAvailable: () => true
});

export const TrashIntervalPicker = createSettingsPicker({
  getValue: () => db.settings.getTrashCleanupInterval(),
  updateValue: (item) => {
    db.settings.setTrashCleanupInterval(item);
  },
  formatValue: (item) => {
    return item === -1
      ? strings.never()
      : item === 1
      ? strings.reminderRecurringMode.day()
      : strings.days(item);
  },
  getItemKey: (item) => item.toString(),
  options: [-1, 1, 7, 30, 365],
  compareValue: (current, item) => current === item,
  isFeatureAvailable: () => true,
  isOptionAvailable: async () => {
    const disableTrashFeature = await isFeatureAvailable("disableTrashCleanup");
    if (!disableTrashFeature.isAllowed) {
      ToastManager.show({
        message: disableTrashFeature.error,
        type: "info",
        actionText: strings.upgrade(),
        func: () => {
          PaywallSheet.present(disableTrashFeature);
        }
      });
    }
    return disableTrashFeature.isAllowed;
  }
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
  compareValue: (current, item) => current === item,
  isFeatureAvailable: () => true,
  isOptionAvailable: () => true
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
    return `${strings[item]()} (${dayjs().format(TimeFormats[item])})`;
  },
  getItemKey: (item) => item,
  options: TIME_FORMATS,
  compareValue: (current, item) => current === item,
  isFeatureAvailable: () => true,
  isOptionAvailable: () => true
});

export const BackupReminderPicker = createSettingsPicker({
  getValue: () => useSettingStore.getState().settings.reminder,
  updateValue: (item) => {
    SettingsService.set({ reminder: item });
  },
  formatValue: (item) => {
    return item === "useroff" ? strings.off() : strings[item]?.();
  },
  getItemKey: (item) => item,
  options: ["useroff", "daily", "weekly", "monthly"],
  compareValue: (current, item) => current === item,
  requiresVerification: () => {
    return (
      !useSettingStore.getState().settings.encryptedBackup &&
      useUserStore.getState().user
    );
  },
  isFeatureAvailable: () => true,
  isOptionAvailable: () => true
});

export const BackupWithAttachmentsReminderPicker = createSettingsPicker({
  getValue: () => useSettingStore.getState().settings.fullBackupReminder,
  updateValue: (item) => {
    SettingsService.set({ fullBackupReminder: item });
  },
  formatValue: (item) => {
    return item === "useroff" || item === "off" || item === "never"
      ? "Off"
      : item.slice(0, 1).toUpperCase() + item.slice(1);
  },
  getItemKey: (item) => item,
  options: ["never", "weekly", "monthly"],
  compareValue: (current, item) => current === item,
  requiresVerification: () => {
    return (
      !useSettingStore.getState().settings.encryptedBackup &&
      useUserStore.getState().user
    );
  },
  isFeatureAvailable: () => true,
  isOptionAvailable: () => true
});

export const ApplockTimerPicker = createSettingsPicker({
  getValue: () => useSettingStore.getState().settings.appLockTimer,
  updateValue: (item) => {
    SettingsService.set({ appLockTimer: item });
  },
  formatValue: (item) => {
    return item === -1
      ? strings.never()
      : item === 0 || item === undefined
      ? strings.immediately()
      : item === 1
      ? strings.minutes(1)
      : strings.minutes(item);
  },
  getItemKey: (item) => item.toString(),
  options: [-1, 0, 1, 5, 15, 30],
  compareValue: (current, item) => current === item,
  onVerify: () => {
    return verifyUserWithApplock();
  },
  isFeatureAvailable: () => true,
  isOptionAvailable: () => true
});
