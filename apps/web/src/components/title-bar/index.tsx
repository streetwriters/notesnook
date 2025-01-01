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

import { useWindowControls } from "../../hooks/use-window-controls";
import { isMac } from "../../utils/platform";
import { BaseThemeProvider } from "../theme-provider";

export const TITLE_BAR_HEIGHT = 37;
export function TitleBar() {
  const { isFullscreen } = useWindowControls();

  if (isFullscreen || !IS_DESKTOP_APP || !isMac()) return null;
  return (
    <BaseThemeProvider
      scope="titleBar"
      className="titlebar"
      sx={{
        background: "background",
        height: TITLE_BAR_HEIGHT,
        minHeight: TITLE_BAR_HEIGHT,
        maxHeight: TITLE_BAR_HEIGHT,
        display: "flex",
        flexShrink: 0,
        position: "absolute",
        top: 0,
        width: "100%",
        zIndex: 1,
        borderBottom: "1px solid var(--border)"
      }}
      injectCssVars
    ></BaseThemeProvider>
  );
}
