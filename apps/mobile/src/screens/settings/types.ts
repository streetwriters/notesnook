import { Settings } from '../../stores/interfaces';

export type SettingSection = {
  type?: 'screen' | 'switch' | 'component';
  name?: string;
  description?: string;
  icon?: string;
  property?: keyof Settings;
  sections?: SettingSection[];
  component?: string;
  modifer?: (property: keyof Settings) => Partial<Settings>;
  getter?: (property: keyof Settings) => any;
};

export type SettingsGroup = {
  name: string;
  sections: SettingSection[];
};

export type RouteParams = {
  SettingsHome: undefined;
  SettingsGroup: SettingSection;
};
