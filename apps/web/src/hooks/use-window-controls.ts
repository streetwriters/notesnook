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
import { desktop } from "../common/desktop-bridge";
import { getPlatform } from "../utils/platform";

export function useWindowControls() {
  const [isMaximized, setIsMaximized] = useState<boolean>();
  const [isFullscreen, setIsFullscreen] = useState<boolean>();

  useEffect(() => {
    let syncTimeout: number | undefined;
    // fullscreen/maximize events can arrive out of order during window
    // state transitions leaving us with a stale value, so we re-query
    // the actual window state whenever the window is focused or resized.
    function syncWindowState() {
      clearTimeout(syncTimeout);
      syncTimeout = window.setTimeout(() => {
        desktop?.window.maximized
          .query()
          .then((value) => setIsMaximized(value));
        desktop?.window.fullscreen
          .query()
          .then((value) => setIsFullscreen(value));
      }, 100);
    }

    const event = desktop?.window.onWindowStateChanged.subscribe(undefined, {
      onData(value) {
        setIsMaximized(value.maximized);
        setIsFullscreen(value.fullscreen);
      }
    });
    syncWindowState();

    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("focus", syncWindowState);
    window.addEventListener("resize", syncWindowState);
    return () => {
      clearTimeout(syncTimeout);
      event?.unsubscribe();
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("focus", syncWindowState);
      window.removeEventListener("resize", syncWindowState);
    };
  }, []);

  return {
    isMaximized,
    isFullscreen,
    hasNativeWindowControls:
      !IS_DESKTOP_APP ||
      hasNativeTitlebar ||
      getPlatform() === "darwin" ||
      getPlatform() === "win32"
  };
}
