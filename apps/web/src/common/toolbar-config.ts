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

import { getDefaultPresets, ToolbarGroupDefinition } from "@notesnook/editor";
import { db } from "./db";
import { migrateToolbar } from "@notesnook/common";
import { strings } from "@notesnook/intl";

const defaultPresets = getDefaultPresets();
export type PresetId = "default" | "minimal" | "custom";
export type Preset = {
  id: PresetId;
  title: string;
  tools: ToolbarGroupDefinition[];
  editable?: boolean;
};
const presets: Record<PresetId, Preset> = {
  default: {
    id: "default",
    title: strings.default(),
    tools: defaultPresets.default
  },
  minimal: {
    id: "minimal",
    title: strings.minimal(),
    tools: defaultPresets.minimal
  },
  custom: { id: "custom", title: strings.custom(), tools: [], editable: true }
};

export async function getCurrentPreset() {
  let preset = db.settings.getToolbarConfig("desktop");
  if (!preset) return presets.default;
  preset = await migrateToolbar("desktop", preset);

  switch (preset.preset as PresetId) {
    case "custom":
      presets.custom.tools = preset.config || [];
      return presets.custom;
    case "minimal":
      return presets.minimal;
    default:
    case "default":
      return presets.default;
  }
}

export function getAllPresets() {
  return Object.values(presets);
}

export function getPreset(id: PresetId) {
  return presets[id];
}

export function getPresetTools(preset: Preset) {
  return preset.tools;
}
