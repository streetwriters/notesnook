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

import type { Lifecycle } from "../../../platform";

let ignoreNext = false;

export const lifecycle: Lifecycle = {
  onVisibilityChanged(handler) {
    const onVisibility = () => {
      if (ignoreNext) {
        ignoreNext = false;
        return;
      }
      handler("visibilitychange", document.hidden);
    };
    const onFocus = () => handler("focus", false);
    const onBlur = () => handler("blur", true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  },
  ignoreNextVisibilityChange() {
    ignoreNext = true;
  },
  onNetworkStatusChanged(handler) {
    const online = () => handler("online");
    const offline = () => handler("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  },
  isOnline: () => navigator.onLine,
  async waitForInternet() {
    return navigator.onLine;
  },
  startIdleDetection(ms, onTrigger) {
    let timer = window.setTimeout(onTrigger, ms);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(onTrigger, ms);
    };
    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((name) => window.addEventListener(name, reset));
    return () => {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, reset));
    };
  },
  async restart() {
    window.location.reload();
  },
  reload() {
    window.location.reload();
  }
};
