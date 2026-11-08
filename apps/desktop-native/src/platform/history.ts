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

import type { Unsubscribe } from "./lifecycle";

export interface HistoryLocation {
  path: string;
  hash: string;
  search: string;
}

export interface HistoryState {
  replace?: boolean;
}

export interface HistoryChange {
  type: "popstate" | "hashchange";
}

export interface History {
  readonly location: HistoryLocation;
  readonly state: HistoryState | null;
  push(location: HistoryLocation, state?: HistoryState | null): void;
  replace(location: HistoryLocation, state?: HistoryState | null): void;
  back(): void;
  subscribe(handler: (change: HistoryChange) => void): Unsubscribe;
  hardNavigate(location: HistoryLocation): void;
}
