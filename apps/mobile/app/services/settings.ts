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
import Orientation from "react-native-orientation";
import { enabled } from "react-native-privacy-snapshot";
import { MMKV } from "../common/database/mmkv";
import { SettingStore, useSettingStore } from "../stores/use-setting-store";
import { AndroidModule } from "../utils";
import { scale, updateSize } from "../utils/size";
import { DDS } from "./device-detection";
import { setAutobackOffMessage } from "./message";

function reset() {
  const settings = get();
  if (settings.reminder !== "off" && settings.reminder !== "useroff") {
    settings.encryptedBackup = false;
    settings.reminder = "useroff";
    set(settings);
    setTimeout(() => setAutobackOffMessage(), 10000);
  }
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
}

function setPrivacyScreen(settings: SettingStore["settings"]) {
  if (settings.privacyScreen || settings.appLockMode === "background") {
    if (Platform.OS === "android") {
      AndroidModule.setSecureMode(true);
    } else {
      enabled(true);
    }
  } else {
    if (Platform.OS === "android") {
      AndroidModule.setSecureMode(false);
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
  Orientation.getOrientation((e: Error, orientation: string) => {
    DDS.checkSmallTab(orientation);
    useSettingStore.getState().setDimensions({
      width: DDS.width as number,
      height: DDS.height as number
    });
    useSettingStore
      .getState()
      .setDeviceMode(
        DDS.isLargeTablet()
          ? "tablet"
          : DDS.isSmallTab
          ? "smallTablet"
          : "mobile"
      );
  });
}

const SettingsService = {
  init,
  set,
  get,
  toggle,
  onFirstLaunch,
  checkOrientation,
  reset,
  getProperty,
  setProperty
};

export default SettingsService;
