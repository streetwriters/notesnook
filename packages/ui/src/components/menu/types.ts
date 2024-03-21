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

import { ThemeUICSSObject } from "@theme-ui/core";

export type MenuItemComponentProps = {
  onClick?: (e?: Event) => void;
};

export type MenuItemTypes = "button" | "separator" | "popup" | "lazy-loader";
export type BaseMenuItem<TType extends MenuItemTypes> = {
  type: TType;
  key: string;
  isHidden?: boolean;
  multiSelect?: boolean;
};

export type MenuSeperatorItem = BaseMenuItem<"separator">;

export type MenuPopupItem = BaseMenuItem<"popup"> & {
  component: (props: MenuItemComponentProps) => JSX.Element;
};

export type LazyMenuItemsLoader = BaseMenuItem<"lazy-loader"> & {
  loader?: React.ReactNode;
  items: () => Promise<MenuItem[]>;
};

export type MenuButtonItem = BaseMenuItem<"button"> & {
  onClick?: () => void;
  title: string;
  icon?: string;
  tooltip?: string;
  isDisabled?: boolean;
  isChecked?: boolean;
  modifier?: string;
  menu?: { title?: string; items: MenuItem[] };
  variant?: "dangerous" | "normal";

  styles?: {
    title?: ThemeUICSSObject;
    icon?: ThemeUICSSObject;
  };
};

export type MenuItem =
  | MenuButtonItem
  | MenuSeperatorItem
  | MenuPopupItem
  | LazyMenuItemsLoader;
