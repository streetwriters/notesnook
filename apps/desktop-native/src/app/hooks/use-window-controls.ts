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
import { useEffect, useState } from "react";
import { environment, windowControls } from "@platform";
import { getPlatform } from "../utils/platform";

export function useWindowControls() {
  const [isMaximized, setIsMaximized] = useState<boolean>();
  const [isFullscreen, setIsFullscreen] = useState<boolean>();

  useEffect(() => {
    windowControls.getState().then((state) => {
      setIsMaximized(state.maximized);
      setIsFullscreen(state.fullscreen);
    });
    return windowControls.onStateChanged((state) => {
      setIsMaximized(state.maximized);
      setIsFullscreen(state.fullscreen);
    });
  }, []);

  return {
    isMaximized,
    isFullscreen,
    hasNativeWindowControls:
      !environment.isDesktopApp ||
      environment.hasNativeTitlebar ||
      getPlatform() === "macOS" ||
      getPlatform() === "Windows"
  };
}
