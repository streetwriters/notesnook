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

import { useStore as useSettingStore } from "../../stores/setting-store";
import { saveAs } from "file-saver";
import { showToast } from "../../utils/toast";
import { showFilePicker, readFile } from "../../utils/file-picker";
import { SettingsGroup } from "./types";
import { sectionGroups, SettingsGroups } from ".";
import { ServersSettings } from "./servers-settings";
import { strings } from "@notesnook/intl";

type ExportedSetting = Record<string, string | number | boolean>;

interface ExportedSettings {
  exportDate: string;
  settings: Record<string, ExportedSetting>;
}

async function extractSettingsValues(
  settingsGroups: SettingsGroup[]
): Promise<ExportedSetting> {
  const exportedSettings: ExportedSetting = {};

  for (const group of settingsGroups) {
    for (const setting of group.settings) {
      if (setting.isHidden?.()) continue;

      const components =
        typeof setting.components === "function"
          ? setting.components()
          : setting.components;

      for (const component of components) {
        if (component.type === "custom") continue;
        if (component.type === "dropdown" && "selectedOption" in component) {
          const value =
            typeof component.selectedOption === "function"
              ? await component.selectedOption()
              : component.selectedOption;
          if (value === "-" || value === undefined) continue;
          exportedSettings[setting.key] = value;
        } else if (component.type === "toggle" && "isToggled" in component) {
          const value =
            typeof component.isToggled === "function"
              ? component.isToggled()
              : component.isToggled;
          exportedSettings[setting.key] = value;
        } else if (component.type === "input" && "defaultValue" in component) {
          const value =
            typeof component.defaultValue === "function"
              ? component.defaultValue()
              : component.defaultValue;
          exportedSettings[setting.key] = value;
        }
      }
    }
  }

  return exportedSettings;
}

export async function exportSettings(): Promise<void> {
  try {
    const toExport: ExportedSettings["settings"] = {};

    for (const group of SettingsGroups) {
      if (group.isHidden?.()) continue;
      if (
        sectionGroups.find((sg) =>
          sg.sections.find((s) => s.key === group.section)?.isHidden?.()
        )
      ) {
        continue;
      }

      const groupSettingsValues = await extractSettingsValues([group]);
      if (Object.keys(groupSettingsValues).length === 0) continue;
      toExport[group.key] = groupSettingsValues;
    }

    toExport[ServersSettings[0].key] = useSettingStore.getState().serverUrls;

    const exportData: ExportedSettings = {
      exportDate: new Date().toISOString(),
      settings: toExport
    };

    const fileName = `notesnook-settings-${
      new Date().toISOString().split("T")[0]
    }.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });

    saveAs(blob, fileName);
    showToast("success", strings.settingsExported());
  } catch (error) {
    console.error("Failed to export settings:", error);
    showToast("error", strings.settingsExportedFailed());
  }
}

async function selectSettingsFile() {
  const [file] = await showFilePicker({
    acceptedFileTypes: ".json"
  });
  if (!file) return;
  return file;
}

export async function importSettingsFile() {
  const settingsFile = await selectSettingsFile();
  if (!settingsFile) return false;
  await importSettings(settingsFile);
  return true;
}

async function applySettingsValues(
  settingsGroups: SettingsGroup[],
  importedValues: ExportedSetting
) {
  for (const group of settingsGroups) {
    if (group.isHidden?.()) continue;

    for (const setting of group.settings) {
      if (setting.isHidden?.()) continue;

      const settingKey = setting.key;
      if (!(settingKey in importedValues)) continue;

      const value = importedValues[settingKey];

      const components =
        typeof setting.components === "function"
          ? setting.components()
          : setting.components;

      for (const component of components) {
        if (
          component.type === "dropdown" &&
          "onSelectionChanged" in component
        ) {
          await component.onSelectionChanged(String(value));
        } else if (component.type === "toggle" && "toggle" in component) {
          const currentValue =
            typeof component.isToggled === "function"
              ? component.isToggled()
              : component.isToggled;
          if (currentValue !== value) {
            await component.toggle();
          }
        } else if (component.type === "input" && "onChange" in component) {
          const inputValue = typeof value === "boolean" ? String(value) : value;
          if (
            component.inputType === "text" &&
            typeof inputValue === "string"
          ) {
            component.onChange(inputValue);
          } else if (
            component.inputType === "number" &&
            typeof inputValue === "number"
          ) {
            component.onChange(inputValue);
          }
        }
      }
    }
  }
}

export async function importSettings(file: File): Promise<void> {
  try {
    const content = await readFile(file);
    const importData: ExportedSettings = JSON.parse(content);

    if (!importData.settings) {
      throw new Error("Invalid settings file format");
    }

    const settingsGroups = importData.settings;

    for (const group of SettingsGroups) {
      const groupKey = group.key;
      if (!(groupKey in settingsGroups)) continue;
      if (group.isHidden?.()) continue;
      if (
        sectionGroups.find((sg) =>
          sg.sections.find((s) => s.key === group.section)?.isHidden?.()
        )
      ) {
        continue;
      }

      const groupSettingsValues = settingsGroups[groupKey];
      if (!groupSettingsValues || typeof groupSettingsValues !== "object") {
        continue;
      }

      await applySettingsValues([group], groupSettingsValues);
    }

    if (settingsGroups.serverUrls) {
      useSettingStore.getState().setServerUrls(settingsGroups.serverUrls);
    }

    await useSettingStore.getState().refresh();

    showToast("success", strings.settingsImported());
  } catch (error) {
    console.error("Failed to import settings:", error);
    showToast("error", strings.settingsImportedFailed());
  }
}
