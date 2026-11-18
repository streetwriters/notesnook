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

import type {
  History,
  HistoryChange,
  HistoryLocation,
  HistoryState
} from "../../../platform";

function url(location: HistoryLocation) {
  return `${location.path}${location.search}${location.hash}`;
}

export const history: History = {
  get location() {
    return {
      path: window.location.pathname,
      hash: window.location.hash,
      search: window.location.search
    };
  },
  get state() {
    return window.history.state as HistoryState | null;
  },
  push(location, state = null) {
    window.history.pushState(state, "", url(location));
  },
  replace(location, state = null) {
    window.history.replaceState(state, "", url(location));
  },
  back() {
    window.history.back();
  },
  subscribe(handler) {
    const onPop = () => handler({ type: "popstate" } as HistoryChange);
    const onHash = () => handler({ type: "hashchange" } as HistoryChange);
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onHash);
    };
  },
  hardNavigate(location) {
    window.location.assign(url(location));
  }
};
