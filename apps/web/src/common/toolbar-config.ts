import { DEFAULT_TOOLS, ToolbarGroupDefinition } from "notesnook-editor";
import { db } from "./db";

export type PresetId = "default" | "minimal" | "custom";
export type Preset = {
  id: PresetId;
  title: string;
  tools: ToolbarGroupDefinition[];
  editable?: boolean;
};
const presets: Record<PresetId, Preset> = {
  default: { id: "default", title: "Default", tools: DEFAULT_TOOLS },
  minimal: {
    id: "minimal",
    title: "Minimal",
    tools: [
      [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "code",
        "highlight",
        "textColor",
      ],
    ],
  },
  custom: { id: "custom", title: "Custom", tools: [], editable: true },
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
  return preset.id === "default" ? preset.tools.slice(1) : preset.tools;
}
