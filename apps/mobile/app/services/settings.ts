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

import { Platform } from "react-native";
import { enabled } from "react-native-privacy-snapshot";
import { MMKV } from "../common/database/mmkv";
import {
  SettingStore,
  defaultSettings,
  useSettingStore
} from "../stores/use-setting-store";
import { NotesnookModule } from "../utils/notesnook-module";
import { scale, updateSize } from "../utils/size";
import { DatabaseLogger } from "../common/database";
import { useUserStore } from "../stores/use-user-store";
function reset() {
  const settings = get();
  if (settings.reminder !== "off" && settings.reminder !== "useroff") {
    settings.encryptedBackup = false;
    settings.reminder = "useroff";
    set(settings);
  }
}

function resetSettings() {
  MMKV.setString(
    "appSettings",
    JSON.stringify({ ...defaultSettings, introCompleted: true })
  );
  init();
}

function migrateAppLock() {
  const appLockMode = get().appLockMode;
  if (appLockMode === "none") {
    if (
      get().appLockEnabled &&
      !get().appLockHasPasswordSecurity &&
      !get().biometricsAuthEnabled
    ) {
      setProperty("biometricsAuthEnabled", true);
    }
    return;
  }
  if (appLockMode === "background") {
    set({
      appLockEnabled: true,
      appLockTimer: 0,
      appLockMode: "none",
      biometricsAuthEnabled: true
    });
  } else if (appLockMode === "launch") {
    set({
      appLockEnabled: true,
      appLockTimer: -1,
      appLockMode: "none",
      biometricsAuthEnabled: true
    });
  }
  DatabaseLogger.debug("App lock Migrated");
}

function init() {
  scale.fontScale = 1;
  const settingsJson = MMKV.getString("appSettings");
  let settings = get();
  if (!settingsJson) {
    MMKV.setString("appSettings", JSON.stringify(settings));
  } else {
    settings = {
      ...settings,
      ...JSON.parse(settingsJson)
    };
  }
  if (settings.fontScale) {
    scale.fontScale = settings.fontScale;
  }
  setTimeout(() => setPrivacyScreen(settings), 1);
  updateSize();
  useSettingStore.getState().setSettings({ ...settings });
  migrateAppLock();
}

function setPrivacyScreen(settings: SettingStore["settings"]) {
  if (settings.privacyScreen || canLockAppInBackground()) {
    if (Platform.OS === "android") {
      NotesnookModule.setSecureMode(true);
    } else {
      enabled(true);
    }
  } else {
    if (Platform.OS === "android") {
      NotesnookModule.setSecureMode(false);
    } else {
      enabled(false);
    }
  }
}

function set(next: Partial<SettingStore["settings"]>) {
  let settings = get();
  settings = {
    ...settings,
    ...next
  };

  useSettingStore.getState().setSettings(settings);
  setTimeout(() => MMKV.setString("appSettings", JSON.stringify(settings)), 1);
}

function toggle(id: keyof SettingStore["settings"]) {
  let settings = get();
  if (typeof settings[id] !== "boolean") return;
  settings = {
    ...settings
  };
  //@ts-ignore
  settings[id] = !settings[id];

  useSettingStore.getState().setSettings(settings);
  MMKV.setString("appSettings", JSON.stringify(settings));
}

function get(): SettingStore["settings"] {
  return { ...useSettingStore.getState().settings };
}

function getProperty<K extends keyof SettingStore["settings"]>(
  property: K
): SettingStore["settings"][K] {
  return useSettingStore.getState().settings[property];
}

function setProperty<K extends keyof SettingStore["settings"]>(
  property: K,
  value: SettingStore["settings"][K]
): void {
  SettingsService.set({
    [property]: value
  });
}

function onFirstLaunch() {
  const introCompleted = get().introCompleted;
  if (!introCompleted) {
    set({
      rateApp: Date.now() + 86400000 * 2,
      nextBackupRequestTime: Date.now() + 86400000 * 3
    });
  }
}

function checkOrientation() {
  //Orientation.getOrientation((e: Error, orientation: string) => {
  // DDS.checkSmallTab(orientation);
  // useSettingStore.getState().setDimensions({
  //   width: DDS.width as number,
  //   height: DDS.height as number
  // });
  // useSettingStore
  //   .getState()
  //   .setDeviceMode(
  //     DDS.isLargeTablet()
  //       ? "tablet"
  //       : DDS.isSmallTab
  //       ? "smallTablet"
  //       : "mobile"
  //   );
  //});
}

function canLockAppInBackground() {
  return get().appLockEnabled && get().appLockTimer !== -1;
}
let backgroundEnterTime = 0;
function appEnteredBackground() {
  if (canLockAppInBackground()) {
    backgroundEnterTime = Date.now();
  }
}

function shouldLockAppOnEnterForeground() {
  if (
    useUserStore.getState().disableAppLockRequests ||
    useSettingStore.getState().requestBiometrics
  )
    return false;

  const settings = get();
  if (!settings.appLockEnabled) return false;
  if (settings.appLockTimer === -1) return false;
  if (settings.appLockTimer === 0) return true;
  const time = Date.now();
  const diff = time - backgroundEnterTime;

  return diff > settings.appLockTimer * 60000;
}

export const SettingsService = {
  init,
  set,
  get,
  toggle,
  onFirstLaunch,
  checkOrientation,
  reset,
  getProperty,
  setProperty,
  resetSettings,
  shouldLockAppOnEnterForeground,
  canLockAppInBackground,
  appEnteredBackground
};

init();
export default SettingsService;
