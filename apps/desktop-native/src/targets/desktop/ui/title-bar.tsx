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

import { View } from "react-native";
import { TitleBar as NativeTitleBar } from "@react-native-gpui/core/desktop";
import { environment } from "@platform";
import type * as Contract from "../../../ui/layout";
import { useWindowControls } from "../../../app/hooks/use-window-controls";
import { useThemeContext } from "./theme";

const AnyView = View as any;

export const TITLE_BAR_HEIGHT = 45;

export function TitleBar({ underlay = true }: Contract.TitleBarProps) {
  const { colors, definition } = useThemeContext();
  const { isFullscreen } = useWindowControls();
  const isMac = environment.os === "macOS";
  if (isMac && isFullscreen) return null;

  if (!isMac)
    return (
      <NativeTitleBar
        title=""
        appearance={definition.colorScheme === "dark" ? "dark" : "light"}
        style={{ backgroundColor: colors.background }}
      />
    );

  return (
    <AnyView
      desktopDragRegion
      testID="title-bar"
      style={{
        position: underlay ? "absolute" : "relative",
        top: 0,
        left: 0,
        right: 0,
        height: TITLE_BAR_HEIGHT,
        zIndex: 1
      }}
    />
  );
}
