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
import { EditorSettings } from "./editor-settings";
import { strings } from "@notesnook/intl";
import dayjs from "dayjs";
import { useEditorManager } from "../../components/editor/manager";

type ExportedSetting = Record<string, string | number | boolean>;

interface ExportedSettings {
  exportDate: string;
  settings: Record<string, ExportedSetting>;
}

async function extractSettingsValues(
  group: SettingsGroup
): Promise<ExportedSetting> {
  const exportedSettings: ExportedSetting = {};

  for (const setting of group.settings) {
    if (setting.isHidden?.()) continue;

    const components =
      typeof setting.components === "function"
        ? setting.components()
        : setting.components;

    for (const component of components) {
      switch (component.type) {
        case "custom":
        case "button":
        case "icon": {
          continue;
        }
        case "dropdown": {
          const value =
            typeof component.selectedOption === "function"
              ? await component.selectedOption()
              : component.selectedOption;
          if (value === "-" || value === "" || value === undefined) continue;
          exportedSettings[setting.key] = value;
          continue;
        }
        case "toggle": {
          const value =
            typeof component.isToggled === "function"
              ? component.isToggled()
              : component.isToggled;
          exportedSettings[setting.key] = value;
          continue;
        }
        case "input": {
          const value =
            typeof component.defaultValue === "function"
              ? component.defaultValue()
              : component.defaultValue;
          exportedSettings[setting.key] = value;
          continue;
        }
        default: {
          throw new Error("Unknown component type");
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

      const groupSettingsValues = await extractSettingsValues(group);
      if (Object.keys(groupSettingsValues).length === 0) continue;

      toExport[group.key] = groupSettingsValues;
    }

    toExport[ServersSettings[0].key] = useSettingStore.getState().serverUrls;
    toExport[EditorSettings[0].key]["toolbar"] = JSON.stringify(
      useEditorManager.getState().toolbarConfig
    );

    const exportData: ExportedSettings = {
      exportDate: dayjs().toISOString(),
      settings: toExport
    };

    const fileName = `notesnook-settings-${dayjs().format("YYYY-MM-DD")}.json`;
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

async function applySettingsValues(
  group: SettingsGroup,
  importedValues: ExportedSetting
) {
  if (group.isHidden?.()) return;

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
      switch (component.type) {
        case "custom":
        case "button":
        case "icon": {
          continue;
        }
        case "dropdown": {
          await component.onSelectionChanged(String(value));
          continue;
        }
        case "toggle": {
          const currentValue =
            typeof component.isToggled === "function"
              ? component.isToggled()
              : component.isToggled;
          if (currentValue !== value) {
            await component.toggle();
          }
          continue;
        }
        case "input": {
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
          continue;
        }
        default: {
          throw new Error("Unknown component type");
        }
      }
    }
  }
}

export async function importSettings(): Promise<void> {
  try {
    const [file] = await showFilePicker({
      acceptedFileTypes: ".json"
    });
    if (!file) return;

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

      await applySettingsValues(group, groupSettingsValues);
    }

    if (settingsGroups.serverUrls) {
      useSettingStore.getState().setServerUrls(settingsGroups.serverUrls);
    }

    if (settingsGroups.editor && settingsGroups.editor.toolbar) {
      useEditorManager.setState({
        toolbarConfig: JSON.parse(String(settingsGroups.editor.toolbar))
      });
    }

    await useSettingStore.getState().refresh();

    showToast("success", strings.settingsImported());
  } catch (error) {
    console.error("Failed to import settings:", error);
    showToast("error", strings.settingsImportedFailed());
  }
}
