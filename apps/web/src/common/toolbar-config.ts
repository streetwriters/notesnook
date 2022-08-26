import {
  getDefaultPresets,
  ToolbarGroupDefinition
} from "@streetwriters/editor";
import { db } from "./db";

const defaultPresets = getDefaultPresets();
export type PresetId = "default" | "minimal" | "custom";
export type Preset = {
  id: PresetId;
  title: string;
  tools: ToolbarGroupDefinition[];
  editable?: boolean;
};
const presets: Record<PresetId, Preset> = {
  default: { id: "default", title: "Default", tools: defaultPresets.default },
  minimal: {
    id: "minimal",
    title: "Minimal",
    tools: defaultPresets.minimal
  },
  custom: { id: "custom", title: "Custom", tools: [], editable: true }
};

export function getCurrentPreset() {
  const preset = db.settings?.getToolbarConfig("desktop");
  if (!preset) return presets.default;
  switch (preset.preset as PresetId) {
    case "custom":
      presets.custom.tools = preset.config;
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
