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

import { TitleBar as NativeTitleBar } from "@react-native-gpui/core/desktop";
import { environment } from "@platform";
import type * as Contract from "../../../ui/layout";
import { useWindowControls } from "../../../app/hooks/use-window-controls";
import { useStyled } from "./style/use-styled";
import { useThemeContext } from "./theme";

export const TITLE_BAR_HEIGHT = 45;

export function TitleBar({
  height = TITLE_BAR_HEIGHT,
  trafficLightInset,
  sx,
  children
}: Contract.TitleBarProps) {
  const { definition } = useThemeContext();
  const { isFullscreen } = useWindowControls();
  const { viewStyle } = useStyled({ sx });
  const isMac = environment.os === "macOS";
  const { paddingLeft = 0, ...rest } = viewStyle as Record<string, unknown>;
  const inset = trafficLightInset ?? (isMac && !isFullscreen ? 78 : 0);

  return (
    <NativeTitleBar
      title=""
      appearance={definition.colorScheme === "dark" ? "dark" : "light"}
      trafficLightInset={0}
      style={[
        { height, gap: 0, paddingRight: 0 },
        rest as never,
        { paddingLeft: inset + (paddingLeft as number) }
      ]}
    >
      {children}
    </NativeTitleBar>
  );
}
