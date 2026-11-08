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

type Entry = { location: HistoryLocation; state: HistoryState | null };

export function createMemoryHistory(onReload: () => void = () => {}): History {
  const entries: Entry[] = [
    { location: { path: "/", hash: "", search: "" }, state: null }
  ];
  let index = 0;
  const handlers = new Set<(change: HistoryChange) => void>();

  const emit = (change: HistoryChange) => handlers.forEach((h) => h(change));

  return {
    get location() {
      return entries[index].location;
    },
    get state() {
      return entries[index].state;
    },
    push(location, state = null) {
      entries.splice(index + 1);
      entries.push({ location, state });
      index = entries.length - 1;
    },
    replace(location, state = null) {
      entries[index] = { location, state };
    },
    back() {
      if (index <= 0) return;
      const from = entries[index].location;
      index--;
      emit({
        type:
          entries[index].location.hash !== from.hash ? "hashchange" : "popstate"
      });
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    hardNavigate(location) {
      entries[index] = { location, state: null };
      onReload();
    }
  };
}
