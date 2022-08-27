import { Settings } from "../../stores/use-setting-store";

export type SettingSection = {
  id: string;
  type?: "screen" | "switch" | "component" | "danger";
  name?: string | ((current?: unknown) => string);
  description?: string | ((current: unknown) => string);
  icon?: string;
  property?: keyof Settings;
  sections?: SettingSection[];
  component?: string;
  modifer?: (...args: unknown[]) => void;
  getter?: (...args: unknown[]) => unknown;
  useHook?: (...args: unknown[]) => unknown;
  hidden?: (current: unknown) => boolean;
  onChange?: (property: boolean) => void;
};

export type SettingsGroup = {
  name: string;
  sections: SettingSection[];
};

export type RouteParams = {
  SettingsHome: { [name: string]: string };
  SettingsGroup: SettingSection;
};
