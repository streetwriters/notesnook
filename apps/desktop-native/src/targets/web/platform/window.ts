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

import type { WindowControls, WindowState } from "../../../platform";

function state(): WindowState {
  return { maximized: false, fullscreen: !!document.fullscreenElement };
}

export const windowControls: WindowControls = {
  setTitle(title) {
    document.title = title;
  },
  getTitle: () => document.title,
  getState: async () => state(),
  onStateChanged(handler) {
    const listener = () => handler(state());
    document.addEventListener("fullscreenchange", listener);
    return () => document.removeEventListener("fullscreenchange", listener);
  },
  enterFullscreen() {
    document.documentElement.requestFullscreen().catch(console.error);
  },
  exitFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(console.error);
  },
  isFullscreen: () => !!document.fullscreenElement,
  focus() {
    window.focus();
  },
  async show() {
    window.focus();
  },
  startedHidden: () => false
};
