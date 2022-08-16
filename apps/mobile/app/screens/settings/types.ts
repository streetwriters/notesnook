import { Settings } from '../../stores/interfaces';

export type SettingSection = {
  id: string;
  type?: 'screen' | 'switch' | 'component' | 'danger';
  name?: string | ((current?: any) => string);
  description?: string | ((current: any) => string);
  icon?: string;
  property?: keyof Settings;
  sections?: SettingSection[];
  component?: string;
  modifer?: (...args: any[]) => void;
  getter?: (...args: any[]) => any;
  useHook?: (...args: any[]) => unknown;
  hidden?: (current: any) => boolean;
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
