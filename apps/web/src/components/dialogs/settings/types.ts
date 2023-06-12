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

import { Icon } from "../../icons";

export type SectionKeys =
  | "profile"
  | "auth"
  | "subscription"
  | "sync"
  | "appearance"
  | "behaviour"
  | "desktop"
  | "notifications"
  | "editor"
  | "backup-export"
  | "export"
  | "importer"
  | "vault"
  | "privacy"
  | "support"
  | "legal"
  | "developer"
  | "about";

export type SectionGroupKeys =
  | "account"
  | "customization"
  | "import-export"
  | "security"
  | "miscellaneous";

export type SectionGroup = {
  key: SectionGroupKeys;
  title: string;
  sections: Section[];
};

export type Section = {
  key: SectionKeys;
  title: string;
  icon: Icon;
  isHidden?: () => boolean;
};

export type SettingsGroup = {
  key: string;
  section: SectionKeys;
  settings: Setting[];
  header: string | ((props: any) => JSX.Element);
  isHidden?: () => boolean;
};

export type Setting = {
  key: string;
  keywords?: string[];
  title: string;
  description?: string;
  components: SettingComponent[] | ((state?: unknown) => SettingComponent[]);
  isHidden?: (state?: unknown) => boolean;
  onStateChange?: (
    listener: (state: unknown, prevState: unknown) => void
  ) => void;
};

export type SettingComponentType =
  | "toggle"
  | "dropdown"
  | "button"
  | "slider"
  | "custom";

export type SettingComponent =
  | ButtonSettingComponent
  | ToggleSettingComponent
  | DropdownSettingComponent;

export type BaseSettingComponent<TType extends SettingComponentType> = {
  type: TType;
};

export type ButtonSettingComponent = BaseSettingComponent<"button"> & {
  title: string;
  action: () => void | Promise<unknown>;
  variant: "primary" | "secondary" | "error" | "errorSecondary";
};

export type ToggleSettingComponent = BaseSettingComponent<"toggle"> & {
  isToggled: () => boolean;
  toggle: () => void | Promise<unknown>;
};

export type DropdownSettingComponent = BaseSettingComponent<"dropdown"> & {
  options: { value: string; title: string; premium?: boolean }[];
  selectedOption: () => string;
  onSelectionChanged: (value: string) => void | Promise<void>;
};
