import { Settings } from '../../stores/interfaces';

export type SettingSection = {
  type?: 'screen' | 'switch' | 'component';
  name?: string;
  description?: string | (() => string);
  icon?: string;
  property?: keyof Settings;
  sections?: SettingSection[];
  component?: string;
  modifer?: (...args: any[]) => void;
  getter?: (...args: any[]) => any;
  useHook?: (...args: any[]) => unknown;
  hidden?: (current: any) => boolean;
};

export type SettingsGroup = {
  name: string;
  sections: SettingSection[];
};

export type RouteParams = {
  SettingsHome: undefined;
  SettingsGroup: SettingSection;
};
