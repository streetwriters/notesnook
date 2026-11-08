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

import type { ReactNode } from "react";
import {
  ThemeScope,
  TITLE_BAR_HEIGHT as UI_TITLE_BAR_HEIGHT,
  TitleBar as UITitleBar,
  type SxProp
} from "@ui";
import type { Icon } from "../icons";

export const TITLE_BAR_HEIGHT = UI_TITLE_BAR_HEIGHT;

export type WindowControl = {
  title: string;
  icon: Icon;
  hidden?: boolean;
  enabled: boolean;
  onClick: () => void;
};

export function getWindowControls(
  _hasNativeWindowControls?: boolean,
  _isFullscreen?: boolean,
  _isMaximized?: boolean,
  _isTablet?: boolean,
  _isMobile?: boolean
): WindowControl[] {
  return [];
}

export function TitleBar(props: {
  children?: ReactNode;
  sx?: SxProp;
  trafficLightInset?: number;
}) {
  return (
    <ThemeScope scope="titleBar">
      <UITitleBar
        trafficLightInset={props.trafficLightInset}
        sx={{ bg: "background", ...props.sx }}
      >
        {props.children}
      </UITitleBar>
    </ThemeScope>
  );
}
