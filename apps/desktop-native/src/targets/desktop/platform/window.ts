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

import { App, DesktopWindow } from "@react-native-gpui/core/desktop";
import type { WindowControls, WindowState } from "../../../platform";

let mainWindow: Promise<DesktopWindow> | undefined;
function main() {
  return (mainWindow ??= DesktopWindow.all().then((windows) => windows[0]));
}

let title = "";
let fullscreen = false;

async function readState(): Promise<WindowState> {
  const state = await (await main()).getState();
  fullscreen = state.isFullscreen;
  return { maximized: state.isMaximized, fullscreen: state.isFullscreen };
}

export const windowControls: WindowControls = {
  setTitle(next) {
    title = next;
    main()
      .then((window) => window.setTitle(next))
      .catch(console.error);
  },
  getTitle: () => title,
  getState: readState,
  onStateChanged(handler) {
    let subscription: { remove(): void } | undefined;
    let removed = false;
    main().then((window) => {
      if (removed) return;
      subscription = window.addListener("stateChange", () => {
        readState().then(handler).catch(console.error);
      });
    });
    return () => {
      removed = true;
      subscription?.remove();
    };
  },
  enterFullscreen() {
    main()
      .then((window) => window.setFullscreen(true))
      .catch(console.error);
  },
  exitFullscreen() {
    main()
      .then((window) => window.setFullscreen(false))
      .catch(console.error);
  },
  isFullscreen: () => fullscreen,
  focus() {
    main()
      .then((window) => window.focus())
      .catch(console.error);
  },
  async show() {
    const window = await main();
    await window.show();
    await window.focus();
  },
  startedHidden: () => App.launchArgs().includes("--hidden")
};
